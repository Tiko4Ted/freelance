import { prisma } from "@/lib/db/prisma";
import { JobService } from "@/lib/services/job-service";

function toShareUrl(origin: string, referralCode: string) {
  const url = new URL("/referral/jobs/", origin);
  url.searchParams.set("referralCode", referralCode);
  url.searchParams.set("utm_source", "referral");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", "job_referral");
  return url.toString();
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

    const jobs = await JobService.listActiveJobs();

    return {
      referralCode: user.referralCode,
      links: jobs.map((job) => ({
        job,
        url: toShareUrl(origin, user.referralCode),
      })),
    };
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
