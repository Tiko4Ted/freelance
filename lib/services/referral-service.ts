import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function toShareUrl(origin: string, referralCode: string) {
  const url = new URL("/referral/jobs", origin);
  url.searchParams.set("referralCode", referralCode);
  url.searchParams.set("utm_source", "referral");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", "job_referral");
  return url.toString();
}

function toDashboardDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function applicationBucket(status: ApplicationStatus) {
  if (
    status === ApplicationStatus.EXPIRED ||
    status === ApplicationStatus.REJECTED
  ) {
    return "failed" as const;
  }

  if (
    status === ApplicationStatus.CERTIFIED ||
    status === ApplicationStatus.MATCHED ||
    status === ApplicationStatus.ACTIVE ||
    status === ApplicationStatus.PAYOUT_ELIGIBLE ||
    status === ApplicationStatus.PAID
  ) {
    return "successful" as const;
  }

  return "pending" as const;
}

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

export const ReferralService = {
  async getMyLinks(userId: string, origin: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return {
      referralCode: user.referralCode,
      url: toShareUrl(origin, user.referralCode),
    };
  },

  async getCandidateApplications(applicantUserId: string) {
    const applications = await prisma.application.findMany({
      where: { applicantUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        hoursLogged: true,
        tasksCompleted: true,
        taskSubmissionFileName: true,
        taskSubmittedAt: true,
        createdAt: true,
        updatedAt: true,
        job: {
          select: {
            id: true,
            title: true,
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

    return applications.map((application) => ({
      id: application.id,
      status: application.status,
      bucket: applicationBucket(application.status),
      hoursLogged: application.hoursLogged,
      tasksCompleted: application.tasksCompleted,
      taskSubmissionFileName: application.taskSubmissionFileName,
      taskSubmittedAt: application.taskSubmittedAt
        ? toDashboardDate(application.taskSubmittedAt)
        : null,
      materialType: isInstructionOnlyJob(application.job)
        ? "instructions"
        : "download",
      appliedAt: toDashboardDate(application.createdAt),
      updatedAt: toDashboardDate(application.updatedAt),
      job: {
        id: application.job.id,
        title: application.job.title,
        payoutType: application.job.payoutType,
      },
    }));
  },

  async getMyApplications(userId: string) {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { clickedAt: "desc" },
      select: {
        id: true,
        clickedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            currency: true,
            payoutAmountCents: true,
          },
        },
        application: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            status: true,
            lockedPayoutCents: true,
            createdAt: true,
          },
        },
      },
    });

    return referrals.map((referral) => ({
      id: referral.id,
      clickedAt: referral.clickedAt.toISOString(),
      job: referral.job,
      application: referral.application
        ? {
            ...referral.application,
            createdAt: referral.application.createdAt.toISOString(),
          }
        : null,
    }));
  },
};
