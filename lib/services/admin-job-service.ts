import { prisma } from "@/lib/db/prisma";
import type {
  AdminCreateJobInput,
  AdminUpdateJobInput,
} from "@/lib/validation/admin";

function toJobResponse(job: {
  id: string;
  title: string;
  description: string;
  payoutAmountCents: number;
  payoutType: string;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export const AdminJobService = {
  async listJobs() {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });

    return jobs.map(toJobResponse);
  },

  async createJob(input: AdminCreateJobInput) {
    const job = await prisma.job.create({ data: input });
    return toJobResponse(job);
  },

  async updateJob(id: string, input: AdminUpdateJobInput) {
    const job = await prisma.job.update({
      where: { id },
      data: input,
    });

    return toJobResponse(job);
  },
};
