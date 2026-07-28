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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.JobSelect;

export type PublicJob = Prisma.JobGetPayload<{
  select: typeof publicJobSelect;
}>;

export const JobRepository = {
  listActive() {
    return prisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
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
