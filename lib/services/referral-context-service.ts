import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_LOOKUPS_PER_WINDOW = 60;
const lookupBuckets = new Map<string, { count: number; resetAt: number }>();

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const bucket = lookupBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    lookupBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_LOOKUPS_PER_WINDOW;
}

export const ReferralContextService = {
  async getPublicContext(
    referralCode: string | null | undefined,
    lookupKey = "anonymous",
  ) {
    if (!referralCode) {
      return null;
    }

    if (isRateLimited(lookupKey)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { referralCode },
      select: {
        name: true,
        role: true,
      },
    });

    if (!user || user.role === Role.CANDIDATE) {
      return null;
    }

    const firstName = getFirstName(user.name);

    return firstName ? { firstName } : null;
  },
};
