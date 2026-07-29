import type { PublicJob } from "@/lib/repositories/job-repository";
import { JobRepository } from "@/lib/repositories/job-repository";

function formatPayout(job: PublicJob) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.currency,
    maximumFractionDigits: 0,
  }).format(job.payoutAmountCents / 100);
}

function formatHourlyPay(job: PublicJob) {
  if (!job.hourlyMinCents || !job.hourlyMaxCents) {
    return null;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.currency,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(job.hourlyMinCents / 100)} - ${formatter.format(
    job.hourlyMaxCents / 100,
  )}/hr`;
}

function describeTrigger(job: PublicJob) {
  if (job.payoutType === "TASK_1") {
    return "after 1 completed task";
  }

  return "after 10 hours worked";
}

function describePostedAt(postedAt: Date) {
  const now = new Date();
  const diffMs = now.getTime() - postedAt.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return "Posted Today";
  }

  if (diffDays === 1) {
    return "Posted Yesterday";
  }

  return `Posted ${diffDays} days ago`;
}

function isNew(postedAt: Date) {
  const now = new Date();
  const diffMs = now.getTime() - postedAt.getTime();
  return diffMs < 1000 * 60 * 60 * 24 * 7;
}

function toPublicJob(job: PublicJob) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    payoutAmountCents: job.payoutAmountCents,
    payoutType: job.payoutType,
    currency: job.currency,
    companyName: job.companyName,
    openings: job.openings,
    hourlyMinCents: job.hourlyMinCents,
    hourlyMaxCents: job.hourlyMaxCents,
    formattedHourlyPay: formatHourlyPay(job),
    formattedPayout: formatPayout(job),
    payoutTriggerLabel: describeTrigger(job),
    postedAt: job.postedAt.toISOString(),
    postedAtLabel: describePostedAt(job.postedAt),
    isNew: isNew(job.postedAt),
    isHighDemand: job.isHighDemand,
    skills: job.skills.map((skill) => ({
      id: skill.id,
      label: skill.label,
    })),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export type PublicJobView = ReturnType<typeof toPublicJob>;

export const JobService = {
  async listActiveJobs() {
    const jobs = await JobRepository.listActive();
    return jobs.map(toPublicJob);
  },

  async getActiveJob(id: string) {
    const job = await JobRepository.findActiveById(id);
    return job ? toPublicJob(job) : null;
  },
};
