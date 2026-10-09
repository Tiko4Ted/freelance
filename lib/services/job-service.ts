import type {
  PublicJob,
  PublicJobCard,
} from "@/lib/repositories/job-repository";
import { JobRepository } from "@/lib/repositories/job-repository";

type PublicJobValueSource = Omit<PublicJob, "description">;

function formatPayout(job: Pick<PublicJobValueSource, "currency" | "payoutAmountCents">) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.currency,
    maximumFractionDigits: 0,
  }).format(job.payoutAmountCents / 100);
}

function formatHourlyPay(
  job: Pick<
    PublicJobValueSource,
    "currency" | "hourlyMinCents" | "hourlyMaxCents"
  >,
) {
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

function formatPay(job: PublicJobValueSource) {
  if (job.payoutType === "TASK_1") {
    return `${formatPayout(job)} per task`;
  }

  return formatHourlyPay(job);
}

function describeTrigger(job: Pick<PublicJobValueSource, "payoutType">) {
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

function toPublicJobValues(job: PublicJobValueSource) {
  return {
    id: job.id,
    title: job.title,
    payoutAmountCents: job.payoutAmountCents,
    payoutType: job.payoutType,
    currency: job.currency,
    companyName: job.companyName,
    openings: job.openings,
    hourlyMinCents: job.hourlyMinCents,
    hourlyMaxCents: job.hourlyMaxCents,
    formattedPay: formatPay(job),
    // Keep the hourly-only field for existing consumers while the UI uses
    // formattedPay for both hourly and task-based roles.
    formattedHourlyPay: formatHourlyPay(job),
    formattedPayout: formatPayout(job),
    payoutTriggerLabel: describeTrigger(job),
    postedAt: job.postedAt.toISOString(),
    postedAtLabel: describePostedAt(job.postedAt),
    isNew: isNew(job.postedAt),
    isHighDemand: job.isHighDemand,
    showOnHome: job.showOnHome,
    skills: job.skills.map((skill) => ({
      id: skill.id,
      label: skill.label,
    })),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

function toPublicJob(job: PublicJob) {
  return {
    ...toPublicJobValues(job),
    description: job.description,
  };
}

function toPublicJobCard(job: PublicJobCard) {
  return toPublicJobValues(job);
}

export type PublicJobView = ReturnType<typeof toPublicJob>;
export type PublicJobListView = Omit<PublicJobView, "description"> & {
  description?: string;
};

// Keep the first navigation light; additional roles are loaded on demand by
// the existing "Load more" control.
const JOB_CARD_PAGE_SIZE = 12;

export const JobService = {
  async listActiveJobs() {
    const jobs = await JobRepository.listActive();
    return jobs.map(toPublicJob);
  },

  async listActiveJobCards(skip = 0) {
    const jobs = await JobRepository.listActiveCards(skip, JOB_CARD_PAGE_SIZE);
    const hasMore = jobs.length > JOB_CARD_PAGE_SIZE;

    return {
      jobs: jobs.slice(0, JOB_CARD_PAGE_SIZE).map(toPublicJobCard),
      hasMore,
    };
  },

  async listHomeProjects() {
    const jobs = await JobRepository.listHomeProjects();
    return jobs.map(toPublicJob);
  },

  async getActiveJob(id: string) {
    const job = await JobRepository.findActiveById(id);
    return job ? toPublicJob(job) : null;
  },
};
