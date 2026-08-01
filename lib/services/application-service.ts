import { ApplicationStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { buildJobDetailCopy } from "@/lib/job-detail-copy";
import type { ApplicationInput } from "@/lib/validation/application";
import type { TaskSubmissionInput } from "@/lib/validation/task-submission";

type ReferralCookie = {
  jobId: string;
  referralCode: string;
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

function isInstructionOnlyJob(job: { title: string; skills: { label: string }[] }) {
  const searchable = `${job.title} ${job.skills
    .map((skill) => skill.label)
    .join(" ")}`.toLowerCase();

  return [
    "audio",
    "voice",
    "recording",
    "video",
    "gameplay",
    "capture",
  ].some((term) => searchable.includes(term));
}

function formatTaskInstructions(application: {
  id: string;
  candidateName: string;
  job: {
    title: string;
    companyName: string;
    skills: { label: string }[];
  };
}) {
  const detailCopy = buildJobDetailCopy(application.job);
  const instructionOnly = isInstructionOnlyJob(application.job);
  const skills = application.job.skills.map((skill) => skill.label).join(", ");

  return [
    `${application.job.title} task instructions`,
    "",
    `Candidate: ${application.candidateName}`,
    `Application ID: ${application.id}`,
    `Company: ${application.job.companyName}`,
    `Required skills: ${skills || "Role-specific expertise"}`,
    "",
    instructionOnly
      ? "Task material type: Instructions only. This role is based on recording, audio, video, or capture work, so no separate PDF material is required."
      : "Task material type: Downloadable instruction pack. Use this document as your working brief and checklist before submitting.",
    "",
    "Scope of work",
    ...detailCopy.scope.map((item) => `- ${item}`),
    "",
    "Submission tips",
    "- Follow the role requirements exactly and keep your work aligned with the requested format.",
    "- Check that every file, recording, or written response is complete before submitting.",
    "- Make sure names, labels, timestamps, and file formats are clear and consistent.",
    "- Review your final work for accuracy, quality, and missing sections before upload.",
    "- Submit only once after confirming the work is complete.",
    "",
    "What reviewers will check",
    "- Completeness against the assigned task instructions.",
    "- Quality, clarity, and relevance of the submitted work.",
    "- Skill fit against the listed role requirements.",
    "- Whether the submission follows formatting, language, or recording instructions.",
    "- Whether the work appears original and ready for customer review.",
    "",
    "After submission",
    "Your dashboard status will update to Pending task review. You will receive an email status update after review.",
  ].join("\n");
}

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
    status: application.status,
    lockedPayoutCents: application.lockedPayoutCents,
    referralId: application.referralId,
    createdAt: application.createdAt.toISOString(),
  };
}

export const ApplicationService = {
  async submitApplication(input: ApplicationInput, referralCookie?: string) {
    const normalizedEmail = normalizeEmail(input.candidateEmail);
    const parsedReferral = parseReferralCookie(referralCookie);

    try {
      const application = await prisma.$transaction(async (tx) => {
        const job = await tx.job.findFirst({
          where: { id: input.jobId, isActive: true },
          select: { id: true, payoutAmountCents: true },
        });

        if (!job) {
          throw new Error("JOB_NOT_FOUND");
        }

        const activeApplication = await tx.application.findFirst({
          where: {
            candidateEmail: normalizedEmail,
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

          if (referrer?.email === normalizedEmail) {
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
            status: true,
            lockedPayoutCents: true,
            referralId: true,
            createdAt: true,
          },
        });
      });

      return toApplicationResponse(application);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("APPLICATION_ALREADY_EXISTS");
      }

      throw error;
    }
  },

  async getTaskMaterial(applicationId: string, candidateEmail: string) {
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        candidateEmail: normalizeEmail(candidateEmail),
      },
      select: {
        id: true,
        candidateName: true,
        status: true,
        job: {
          select: {
            title: true,
            companyName: true,
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

    return {
      fileName: `${application.job.title
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase()}-task-instructions.txt`,
      content: formatTaskInstructions(application),
    };
  },

  async submitTask(
    applicationId: string,
    candidateEmail: string,
    input: TaskSubmissionInput,
  ) {
    const updatedApplication = await prisma.application.updateMany({
      where: {
        id: applicationId,
        candidateEmail: normalizeEmail(candidateEmail),
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
  },
};
