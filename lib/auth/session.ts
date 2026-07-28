import { Role } from "@prisma/client";

import { auth } from "@/auth";

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
  }
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function requireRole(role: Role) {
  const session = await requireSession();

  if (session.user.role !== role) {
    throw new ForbiddenError();
  }

  return session;
}
