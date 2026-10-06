import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

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

export function loginRedirectUrl(callbackUrl: string) {
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export async function requirePageSession(callbackUrl: string) {
  try {
    return await requireSession();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect(loginRedirectUrl(callbackUrl));
    }

    throw error;
  }
}
