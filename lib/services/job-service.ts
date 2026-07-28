import type { PublicJob } from "@/lib/repositories/job-repository";
import { JobRepository } from "@/lib/repositories/job-repository";

function formatPayout(job: PublicJob) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.currency,
    maximumFractionDigits: 0,
  }).format(job.payoutAmountCents / 100);
}

function describeTrigger(job: PublicJob) {
  if (job.payoutType === "TASK_1") {
    return "after 1 completed task";
  }

  return "after 10 hours worked";
}

function toPublicJob(job: PublicJob) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    payoutAmountCents: job.payoutAmountCents,
    payoutType: job.payoutType,
    currency: job.currency,
    formattedPayout: formatPayout(job),
    payoutTriggerLabel: describeTrigger(job),
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
