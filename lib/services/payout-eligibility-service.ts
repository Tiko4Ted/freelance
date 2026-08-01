import { ApplicationStatus } from "@prisma/client";

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
        await tx.candidateIdentity.upsert({
          where: { email: application.candidateEmail },
          update: {},
          create: { email: application.candidateEmail },
        });

        await tx.application.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.PAYOUT_ELIGIBLE },
        });

        return application.lockedPayoutCents
          ? "PAYOUT_ELIGIBLE"
          : "PAYOUT_ELIGIBLE_WITHOUT_AMOUNT";
      });

      results.push({ applicationId: application.id, result });
    }

    return results;
  },
};
