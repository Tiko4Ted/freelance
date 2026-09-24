import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EmailNotificationService } from "@/lib/services/email-notification-service";
import type {
  AdminProgressInput,
  AdminStatusInput,
} from "@/lib/validation/admin";

function addThreeMonths(date: Date) {
  const deadline = new Date(date);
  deadline.setMonth(deadline.getMonth() + 3);
  return deadline;
}

const capacityStatuses = new Set<ApplicationStatus>([
  ApplicationStatus.CERTIFIED,
  ApplicationStatus.MATCHED,
  ApplicationStatus.ACTIVE,
  ApplicationStatus.CERTIFYING,
  ApplicationStatus.PAYOUT_ELIGIBLE,
  ApplicationStatus.PAID,
]);

function toApplicationResponse(application: {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhoneCountry: string | null;
  candidatePhoneCountryCode: string | null;
  candidatePhoneNumber: string | null;
  candidateLinkedinUrl: string | null;
  resumeFileName: string | null;
  startAvailabilityDays: number | null;
  expectedHourlyRateUsd: number | null;
  weeklyAvailabilityHours: number | null;
  strongestTools: string[];
  aptitudeScorePercent: number | null;
  aptitudeCorrectAnswers: number;
  aptitudeQuestionCount: number;
  aptitudePassed: boolean;
  aptitudeSubmittedAt: Date | null;
  status: ApplicationStatus;
  lockedPayoutCents: number | null;
  hoursLogged: number;
  tasksCompleted: number;
  taskSubmissionFileName: string | null;
  taskSubmissionNotes: string | null;
  taskSubmittedAt: Date | null;
  onboardedAt: Date | null;
  payoutDeadline: Date | null;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    payoutType: string;
  };
  referral: {
    referrer: {
      id: string;
      email: string;
      name: string;
    };
  } | null;
}) {
  return {
    id: application.id,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    candidatePhoneCountry: application.candidatePhoneCountry,
    candidatePhoneCountryCode: application.candidatePhoneCountryCode,
    candidatePhoneNumber: application.candidatePhoneNumber,
    candidateLinkedinUrl: application.candidateLinkedinUrl,
    resumeFileName: application.resumeFileName,
    startAvailabilityDays: application.startAvailabilityDays,
    expectedHourlyRateUsd: application.expectedHourlyRateUsd,
    weeklyAvailabilityHours: application.weeklyAvailabilityHours,
    strongestTools: application.strongestTools,
    aptitudeScorePercent: application.aptitudeScorePercent,
    aptitudeCorrectAnswers: application.aptitudeCorrectAnswers,
    aptitudeQuestionCount: application.aptitudeQuestionCount,
    aptitudePassed: application.aptitudePassed,
    aptitudeSubmittedAt: application.aptitudeSubmittedAt?.toISOString() ?? null,
    status: application.status,
    lockedPayoutCents: application.lockedPayoutCents,
    hoursLogged: application.hoursLogged,
    tasksCompleted: application.tasksCompleted,
    taskSubmissionFileName: application.taskSubmissionFileName,
    taskSubmissionNotes: application.taskSubmissionNotes,
    taskSubmittedAt: application.taskSubmittedAt?.toISOString() ?? null,
    onboardedAt: application.onboardedAt?.toISOString() ?? null,
    payoutDeadline: application.payoutDeadline?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    job: application.job,
    referrer: application.referral?.referrer ?? null,
  };
}

const applicationSelect = {
  id: true,
  candidateName: true,
  candidateEmail: true,
  candidatePhoneCountry: true,
  candidatePhoneCountryCode: true,
  candidatePhoneNumber: true,
  candidateLinkedinUrl: true,
  resumeFileName: true,
  startAvailabilityDays: true,
  expectedHourlyRateUsd: true,
  weeklyAvailabilityHours: true,
  strongestTools: true,
  aptitudeScorePercent: true,
  aptitudeCorrectAnswers: true,
  aptitudeQuestionCount: true,
  aptitudePassed: true,
  aptitudeSubmittedAt: true,
  status: true,
  lockedPayoutCents: true,
  hoursLogged: true,
  tasksCompleted: true,
  taskSubmissionFileName: true,
  taskSubmissionNotes: true,
  taskSubmittedAt: true,
  onboardedAt: true,
  payoutDeadline: true,
  createdAt: true,
  job: {
    select: {
      id: true,
      title: true,
      payoutType: true,
    },
  },
  referral: {
    select: {
      referrer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  },
};

export const AdminApplicationService = {
  async listApplications() {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      select: applicationSelect,
    });

    return applications.map(toApplicationResponse);
  },

  async updateStatus(id: string, input: AdminStatusInput) {
    const now = new Date();
    const activationData =
      input.status === ApplicationStatus.ACTIVE
        ? {
            onboardedAt: now,
            payoutDeadline: addThreeMonths(now),
          }
        : {};

    const { application, previousStatus } = await prisma.$transaction(async (tx) => {
      const existingApplication = await tx.application.findUniqueOrThrow({
        where: { id },
        select: { jobId: true, status: true },
      });
      const occupiedBefore = capacityStatuses.has(existingApplication.status);
      const occupiedAfter = capacityStatuses.has(input.status);

      if (!occupiedBefore && occupiedAfter) {
        const reservation = await tx.job.updateMany({
          where: {
            id: existingApplication.jobId,
            isActive: true,
            openings: { gt: 0 },
          },
          data: { openings: { decrement: 1 } },
        });

        if (reservation.count !== 1) {
          throw new Error("PROJECT_FULL");
        }
      } else if (occupiedBefore && !occupiedAfter) {
        await tx.job.update({
          where: { id: existingApplication.jobId },
          data: { openings: { increment: 1 } },
        });
      }

      const updatedApplication = await tx.application.update({
        where: { id },
        data: {
          status: input.status,
          ...activationData,
        },
        select: applicationSelect,
      });

      return {
        application: updatedApplication,
        previousStatus: existingApplication.status,
      };
    });

    await EmailNotificationService.notifyApplicationStatusChanged(
      application.id,
      previousStatus,
    );

    return toApplicationResponse(application);
  },

  async logProgress(id: string, input: AdminProgressInput) {
    const application = await prisma.application.update({
      where: { id },
      data: {
        hoursLogged: input.hoursLogged,
        tasksCompleted: input.tasksCompleted,
      },
      select: applicationSelect,
    });

    return toApplicationResponse(application);
  },
};
