import { prisma } from "@/lib/db/prisma";
import type {
  AdminCreateJobInput,
  AdminUpdateJobInput,
} from "@/lib/validation/admin";

const adminJobInclude = {
  skills: {
    orderBy: { label: "asc" as const },
  },
};

function toJobResponse(job: {
  id: string;
  title: string;
  description: string;
  payoutAmountCents: number;
  payoutType: string;
  currency: string;
  companyName: string;
  openings: number;
  hourlyMinCents: number | null;
  hourlyMaxCents: number | null;
  postedAt: Date;
  isHighDemand: boolean;
  showOnHome: boolean;
  isAiTask: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  skills?: { id: string; label: string }[];
}) {
  return {
    ...job,
    postedAt: job.postedAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export const AdminJobService = {
  async listJobs() {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: adminJobInclude,
    });

    return jobs.map(toJobResponse);
  },

  async createJob(input: AdminCreateJobInput) {
    const { skills, ...jobInput } = input;
    const job = await prisma.job.create({
      data: {
        ...jobInput,
        isAiTask: true,
        skills: {
          create: skills.map((label) => ({ label })),
        },
      },
      include: adminJobInclude,
    });

    return toJobResponse(job);
  },

  async updateJob(id: string, input: AdminUpdateJobInput) {
    const { skills, ...jobInput } = input;
    const result = await prisma.$transaction(async (tx) => {
      const previousJob = await tx.job.findUniqueOrThrow({
        where: { id },
        select: { showOnHome: true },
      });
      const updatedJob = await tx.job.update({
        where: { id },
        data: {
          ...jobInput,
          isAiTask: true,
        },
        include: adminJobInclude,
      });

      if (skills) {
        await tx.jobSkill.deleteMany({ where: { jobId: id } });
        await tx.jobSkill.createMany({
          data: skills.map((label) => ({ jobId: id, label })),
        });

        const job = await tx.job.findUniqueOrThrow({
          where: { id },
          include: adminJobInclude,
        });

        return { job, wasShownOnHome: previousJob.showOnHome };
      }

      return {
        job: updatedJob,
        wasShownOnHome: previousJob.showOnHome,
      };
    });

    return {
      job: toJobResponse(result.job),
      wasShownOnHome: result.wasShownOnHome,
    };
  },
};
