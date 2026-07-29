import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const publicJobSelect = {
  id: true,
  title: true,
  description: true,
  payoutAmountCents: true,
  payoutType: true,
  currency: true,
  isActive: true,
  companyName: true,
  openings: true,
  hourlyMinCents: true,
  hourlyMaxCents: true,
  postedAt: true,
  isHighDemand: true,
  createdAt: true,
  updatedAt: true,
  skills: {
    select: {
      id: true,
      label: true,
    },
    orderBy: {
      label: "asc",
    },
  },
} satisfies Prisma.JobSelect;

export type PublicJob = Prisma.JobGetPayload<{
  select: typeof publicJobSelect;
}>;

export const JobRepository = {
  listActive() {
    return prisma.job.findMany({
      where: { isActive: true },
      orderBy: { postedAt: "desc" },
      select: publicJobSelect,
    });
  },

  findActiveById(id: string) {
    return prisma.job.findFirst({
      where: { id, isActive: true },
      select: publicJobSelect,
    });
  },
};
