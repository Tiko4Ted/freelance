import {
  ApplicationStatus,
  LedgerAccount,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EmailNotificationService } from "@/lib/services/email-notification-service";

export function isThresholdMet(application: {
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

export function isPastDeadline(deadline: Date | null, now: Date) {
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
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        candidateEmail: true,
        lockedPayoutCents: true,
        hoursLogged: true,
        tasksCompleted: true,
        payoutDeadline: true,
        job: {
          select: {
            id: true,
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
        const expired = await prisma.$transaction(async (tx) => {
          const update = await tx.application.updateMany({
            where: { id: application.id, status: ApplicationStatus.ACTIVE },
            data: { status: ApplicationStatus.EXPIRED },
          });

          if (update.count === 1) {
            await tx.job.update({
              where: { id: application.job.id },
              data: { openings: { increment: 1 } },
            });
          }

          return update;
        });

        if (expired.count === 1) {
          await EmailNotificationService.notifyApplicationStatusChanged(
            application.id,
            ApplicationStatus.ACTIVE,
          );
        }

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

        const logDuplicateMatch = async () => {
          if (application.referral) {
            await tx.ledgerEntry
              .create({
                data: {
                  userId: application.referral.referrerId,
                  amountCents: 0,
                  account: LedgerAccount.FUNDING,
                  reason: "DUPLICATE_MATCH_NO_PAYOUT",
                  applicationId: application.id,
                },
                select: { id: true },
              })
              .catch((error: unknown) => {
                if (!isUniqueConstraintError(error)) {
                  throw error;
                }
              });
          }

          await tx.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.PAID },
          });

          return "ALREADY_MATCHED" as const;
        };

        if (
          identity.hasBeenPaidOut ||
          (identity.firstMatchedApplicationId &&
            identity.firstMatchedApplicationId !== application.id)
        ) {
          return logDuplicateMatch();
        }

        if (!identity.firstMatchedApplicationId) {
          const claimedIdentity = await tx.candidateIdentity.updateMany({
            where: {
              email: application.candidateEmail,
              firstMatchedApplicationId: null,
            },
            data: { firstMatchedApplicationId: application.id },
          });

          if (claimedIdentity.count !== 1) {
            const currentIdentity = await tx.candidateIdentity.findUniqueOrThrow({
              where: { email: application.candidateEmail },
              select: {
                firstMatchedApplicationId: true,
                hasBeenPaidOut: true,
              },
            });

            if (
              currentIdentity.hasBeenPaidOut ||
              currentIdentity.firstMatchedApplicationId !== application.id
            ) {
              return logDuplicateMatch();
            }
          }
        }

        if (!application.referral || !application.lockedPayoutCents) {
          await tx.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.PAID },
          });

          return application.referral ? "NO_PAYOUT_AMOUNT" : "NO_REFERRAL";
        }

        const ledgerEntry = await tx.ledgerEntry
          .create({
            data: {
              userId: application.referral.referrerId,
              amountCents: application.lockedPayoutCents,
              account: LedgerAccount.FUNDING,
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
            fundingBalanceCents: {
              increment: application.lockedPayoutCents,
            },
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
