import { ApplicationStatus, Prisma, Role } from "@prisma/client";

import { scoreAptitudeTest } from "@/lib/aptitude-test";
import { prisma } from "@/lib/db/prisma";
import { createSimplePdf } from "@/lib/pdf/simple-pdf";
import { EmailNotificationService } from "@/lib/services/email-notification-service";
import { OnboardingService } from "@/lib/services/onboarding-service";
import { buildTaskAssignment } from "@/lib/task-assignment";
import type { ApplicationInput } from "@/lib/validation/application";
import type { TaskSubmissionInput } from "@/lib/validation/task-submission";

type ReferralCookie = {
  jobId: string;
  referralCode: string;
};

type AuthenticatedApplicant = {
  id: string;
  email: string;
};

function parseReferralCookie(value: string | undefined): ReferralCookie | null {
  if (!value) {
    return null;
  }

  const [jobId, referralCode] = value.split(":");

  if (!jobId || !referralCode) {
    return null;
  }

  return { jobId, referralCode };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

const blockingApplicationStatuses = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.CERTIFIED,
  ApplicationStatus.MATCHED,
  ApplicationStatus.ACTIVE,
];

function toApplicationResponse(application: {
  id: string;
  jobId: string;
  candidateEmail: string;
  candidateName: string;
  candidateFirstName: string | null;
  candidateLastName: string | null;
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
  referralId: string | null;
  createdAt: Date;
}) {
  return {
    id: application.id,
    jobId: application.jobId,
    candidateEmail: application.candidateEmail,
    candidateName: application.candidateName,
    candidateFirstName: application.candidateFirstName,
    candidateLastName: application.candidateLastName,
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
    referralId: application.referralId,
    createdAt: application.createdAt.toISOString(),
  };
}

export const ApplicationService = {
  async submitApplication(
    input: ApplicationInput,
    applicant: AuthenticatedApplicant,
    referralCookie?: string,
  ) {
    const normalizedEmail = normalizeEmail(applicant.email);
    const parsedReferral = parseReferralCookie(referralCookie);

    try {
      const application = await prisma.$transaction(async (tx) => {
        const job = await tx.job.findFirst({
          where: { id: input.jobId, isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            payoutAmountCents: true,
            payoutType: true,
            skills: {
              select: {
                label: true,
              },
            },
          },
        });

        if (!job) {
          throw new Error("JOB_NOT_FOUND");
        }

        const aptitudeResult = scoreAptitudeTest(job, input.aptitudeAnswers);

        const activeApplication = await tx.application.findFirst({
          where: {
            applicantUserId: applicant.id,
            status: { in: blockingApplicationStatuses },
            taskSubmittedAt: null,
          },
          select: {
            id: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        });

        if (activeApplication) {
          throw new Error(
            `ACTIVE_APPLICATION:${activeApplication.job.title}`,
          );
        }

        const applicationStatus = aptitudeResult.passed
          ? ApplicationStatus.CERTIFIED
          : ApplicationStatus.APPLIED;

        if (applicationStatus === ApplicationStatus.CERTIFIED) {
          const reservation = await tx.job.updateMany({
            where: {
              id: job.id,
              isActive: true,
              openings: { gt: 0 },
            },
            data: {
              openings: { decrement: 1 },
            },
          });

          if (reservation.count !== 1) {
            throw new Error("PROJECT_FULL");
          }
        }

        await tx.candidateIdentity.upsert({
          where: { email: normalizedEmail },
          update: {},
          create: { email: normalizedEmail },
        });

        let referralId: string | undefined;

        if (parsedReferral?.jobId === job.id) {
          const referrer = await tx.user.findUnique({
            where: { referralCode: parsedReferral.referralCode },
            select: { id: true, email: true, role: true },
          });

          if (referrer?.id === applicant.id || referrer?.email === normalizedEmail) {
            throw new Error("SELF_REFERRAL");
          }

          if (referrer && referrer.role !== Role.CANDIDATE) {
            const referral = await tx.referral.create({
              data: {
                referrerId: referrer.id,
                jobId: job.id,
              },
              select: { id: true },
            });

            referralId = referral.id;
          }
        }

        return tx.application.create({
          data: {
            applicantUserId: applicant.id,
            jobId: job.id,
            candidateEmail: normalizedEmail,
            candidateName: input.candidateName.trim(),
            candidateFirstName: input.candidateFirstName ?? null,
            candidateLastName: input.candidateLastName ?? null,
            candidatePhoneCountry: input.candidatePhoneCountry ?? null,
            candidatePhoneCountryCode: input.candidatePhoneCountryCode ?? null,
            candidatePhoneNumber: input.candidatePhoneNumber ?? null,
            candidateLinkedinUrl: input.candidateLinkedinUrl ?? null,
            resumeFileName: input.resumeFileName ?? null,
            startAvailabilityDays: input.startAvailabilityDays ?? null,
            expectedHourlyRateUsd: input.expectedHourlyRateUsd ?? null,
            weeklyAvailabilityHours: input.weeklyAvailabilityHours ?? null,
            strongestTools: input.strongestTools,
            aptitudeAnswers: input.aptitudeAnswers,
            aptitudeScorePercent: aptitudeResult.scorePercent,
            aptitudeCorrectAnswers: aptitudeResult.correctCount,
            aptitudeQuestionCount: aptitudeResult.totalQuestions,
            aptitudePassed: aptitudeResult.passed,
            aptitudeSubmittedAt: new Date(),
            status: applicationStatus,
            lockedPayoutCents: job.payoutAmountCents,
            referralId,
          },
          select: {
            id: true,
            jobId: true,
            candidateEmail: true,
            candidateName: true,
            candidateFirstName: true,
            candidateLastName: true,
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
            referralId: true,
            createdAt: true,
          },
        });
      });

      await EmailNotificationService.notifyApplicationSubmitted(application.id);

      return toApplicationResponse(application);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("APPLICATION_ALREADY_EXISTS");
      }

      throw error;
    }
  },

  async getTaskMaterial(applicationId: string, applicantUserId: string) {
    const onboarding = await OnboardingService.getStatus(applicantUserId);
    if (!onboarding.complete) {
      throw new Error("APPLICATION_NOT_FOUND");
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        applicantUserId,
        status: {
          in: [
            ApplicationStatus.ACTIVE,
            ApplicationStatus.MATCHED,
            ApplicationStatus.CERTIFIED,
          ],
        },
      },
      select: {
        id: true,
        candidateName: true,
        status: true,
        job: {
          select: {
            title: true,
            description: true,
            companyName: true,
            payoutType: true,
            skills: {
              select: {
                label: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new Error("APPLICATION_NOT_FOUND");
    }

    const assignment = buildTaskAssignment(application);

    return {
      fileName: `${assignment.fileBaseName}.pdf`,
      content: createSimplePdf(assignment.title, assignment.sections),
    };
  },

  async submitTask(
    applicationId: string,
    applicantUserId: string,
    input: TaskSubmissionInput,
  ) {
    const onboarding = await OnboardingService.getStatus(applicantUserId);
    if (!onboarding.complete) {
      throw new Error("TASK_NOT_SUBMITTABLE");
    }

    const existingApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
        applicantUserId,
        taskSubmittedAt: null,
        status: {
          in: [
            ApplicationStatus.ACTIVE,
            ApplicationStatus.MATCHED,
            ApplicationStatus.CERTIFIED,
          ],
        },
      },
      select: {
        status: true,
      },
    });

    if (!existingApplication) {
      throw new Error("TASK_NOT_SUBMITTABLE");
    }

    const updatedApplication = await prisma.application.updateMany({
      where: {
        id: applicationId,
        applicantUserId,
        taskSubmittedAt: null,
        status: {
          in: [
            ApplicationStatus.ACTIVE,
            ApplicationStatus.MATCHED,
            ApplicationStatus.CERTIFIED,
          ],
        },
      },
      data: {
        status: ApplicationStatus.CERTIFYING,
        taskSubmissionFileName: input.fileName.trim(),
        taskSubmissionNotes: input.notes.trim(),
        taskSubmittedAt: new Date(),
        tasksCompleted: 1,
      },
    });

    if (updatedApplication.count !== 1) {
      throw new Error("TASK_NOT_SUBMITTABLE");
    }

    await EmailNotificationService.notifyApplicationStatusChanged(
      applicationId,
      existingApplication.status,
    );
  },
};
