const USER_FAILURE_LIMIT = 5;
const IP_FAILURE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1_000;
const LOCKOUT_MS = 30 * 60 * 1_000;

type FailureBucket = {
  windowStartedAt: Date;
  count: number;
  lockedUntil: Date | null;
};

export type VerificationRateLimitResult = {
  locked: boolean;
  retryAfterSeconds: number;
  userFailures: number;
};

export class InMemoryFreelanceIdentityVerificationRateLimiter {
  private readonly userBuckets = new Map<string, FailureBucket>();
  private readonly ipBuckets = new Map<string, FailureBucket>();

  check(input: {
    userId: string;
    ipAddress: string | null;
    now: Date;
  }): VerificationRateLimitResult {
    const user = getBucket(this.userBuckets, input.userId, input.now);
    const ip = input.ipAddress
      ? getBucket(this.ipBuckets, input.ipAddress, input.now)
      : null;
    const state = lockState([user, ip], input.now);

    return {
      ...state,
      userFailures: user.count,
    };
  }

  recordFailure(input: {
    userId: string;
    ipAddress: string | null;
    now: Date;
  }): VerificationRateLimitResult {
    const user = getBucket(this.userBuckets, input.userId, input.now);
    user.count += 1;
    if (user.count > USER_FAILURE_LIMIT) {
      user.lockedUntil = new Date(input.now.getTime() + LOCKOUT_MS);
    }

    const buckets: (FailureBucket | null)[] = [user];
    if (input.ipAddress) {
      const ip = getBucket(this.ipBuckets, input.ipAddress, input.now);
      ip.count += 1;
      if (ip.count > IP_FAILURE_LIMIT) {
        ip.lockedUntil = new Date(input.now.getTime() + LOCKOUT_MS);
      }
      buckets.push(ip);
    }

    return {
      ...lockState(buckets, input.now),
      userFailures: user.count,
    };
  }
}

export const freelanceIdentityVerificationRateLimiter =
  new InMemoryFreelanceIdentityVerificationRateLimiter();

function getBucket(
  buckets: Map<string, FailureBucket>,
  key: string,
  now: Date,
): FailureBucket {
  const existing = buckets.get(key);
  if (
    existing &&
    now.getTime() - existing.windowStartedAt.getTime() < WINDOW_MS
  ) {
    return existing;
  }

  const bucket = { windowStartedAt: now, count: 0, lockedUntil: null };
  buckets.set(key, bucket);
  return bucket;
}

function lockState(
  buckets: (FailureBucket | null)[],
  now: Date,
): { locked: boolean; retryAfterSeconds: number } {
  const lockedUntil = buckets
    .map((bucket) => bucket?.lockedUntil)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (!lockedUntil || lockedUntil.getTime() <= now.getTime()) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.ceil(
      (lockedUntil.getTime() - now.getTime()) / 1_000,
    ),
  };
}
