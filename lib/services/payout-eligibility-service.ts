import { ApplicationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function isThresholdMet(application: {
  hoursLogged: number;
  tasksCompleted: number;
  job: {
    payoutType: string;
  };
}) {
  return (
    application.hoursLogged >= 10 ||
    (application.job.payoutType === "TASK_1" && application.tasksCompleted >= 1)
  );
}

function isPastDeadline(deadline: Date | null, now: Date) {
  return deadline ? deadline.getTime() < now.getTime() : false;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export const PayoutEligibilityService = {
  async runOnce(now = new Date()) {
    const activeApplications = await prisma.application.findMany({
      where: { status: ApplicationStatus.ACTIVE },
      select: {
        id: true,
        candidateEmail: true,
        lockedPayoutCents: true,
        hoursLogged: true,
        tasksCompleted: true,
        payoutDeadline: true,
        job: {
          select: {
            payoutType: true,
          },
        },
        referral: {
          select: {
            referrerId: true,
          },
        },
      },
    });

    const results = [];

    for (const application of activeApplications) {
      if (isPastDeadline(application.payoutDeadline, now)) {
        await prisma.application.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.EXPIRED },
        });
        results.push({ applicationId: application.id, result: "EXPIRED" });
        continue;
      }

      if (!isThresholdMet(application)) {
        results.push({ applicationId: application.id, result: "PENDING" });
        continue;
      }

      const result = await prisma.$transaction(async (tx) => {
        const identity = await tx.candidateIdentity.upsert({
          where: { email: application.candidateEmail },
          update: {},
          create: { email: application.candidateEmail },
        });

        if (
          identity.firstMatchedApplicationId &&
          identity.firstMatchedApplicationId !== application.id
        ) {
          await tx.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.PAID },
          });

          return "ALREADY_MATCHED";
        }

        if (!identity.firstMatchedApplicationId) {
          await tx.candidateIdentity.update({
            where: { email: application.candidateEmail },
            data: { firstMatchedApplicationId: application.id },
          });
        }

        if (!application.referral || !application.lockedPayoutCents) {
          await tx.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.PAID },
          });

          return "NO_REFERRAL";
        }

        const ledgerEntry = await tx.ledgerEntry
          .create({
            data: {
              userId: application.referral.referrerId,
              amountCents: application.lockedPayoutCents,
              reason: "REFERRAL_PAYOUT",
              applicationId: application.id,
            },
            select: { id: true },
          })
          .catch((error: unknown) => {
            if (isUniqueConstraintError(error)) {
              return null;
            }

            throw error;
          });

        if (!ledgerEntry) {
          await tx.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.PAYOUT_ELIGIBLE },
          });

          return "ALREADY_CREDITED";
        }

        await tx.user.update({
          where: { id: application.referral.referrerId },
          data: {
            walletBalanceCents: {
              increment: application.lockedPayoutCents,
            },
          },
        });

        await tx.candidateIdentity.update({
          where: { email: application.candidateEmail },
          data: { hasBeenPaidOut: true },
        });

        await tx.application.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.PAYOUT_ELIGIBLE },
        });

        return "PAYOUT_ELIGIBLE";
      });

      results.push({ applicationId: application.id, result });
    }

    return results;
  },
};
