import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  referralCode: string;
};

export type UserWithPassword = SafeUser & {
  passwordHash: string;
};

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  referralCode: true,
} satisfies Prisma.UserSelect;

const userWithPasswordSelect = {
  ...safeUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export const UserRepository = {
  findSafeByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });
  },

  findWithPasswordByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: userWithPasswordSelect,
    });
  },

  create(input: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
  }) {
    return prisma.user.create({
      data: input,
      select: safeUserSelect,
    });
  },
};
