import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryFreelanceIdentityVerificationRateLimiter } from "../lib/services/freelance-identity-verification-rate-limit";

test("locks a user for 30 minutes after more than 5 failed verification attempts", () => {
  const limiter = new InMemoryFreelanceIdentityVerificationRateLimiter();
  const now = new Date("2026-08-02T12:00:00.000Z");
  const input = {
    userId: "user-rate-limit",
    ipAddress: "203.0.113.10",
    now,
  };

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = limiter.recordFailure(input);
    assert.equal(result.locked, false);
    assert.equal(result.userFailures, attempt);
  }

  const locked = limiter.recordFailure(input);

  assert.equal(locked.locked, true);
  assert.equal(locked.userFailures, 6);
  assert.equal(locked.retryAfterSeconds, 30 * 60);
});

test("locks an IP for 30 minutes after more than 10 failed verification attempts", () => {
  const limiter = new InMemoryFreelanceIdentityVerificationRateLimiter();
  const now = new Date("2026-08-02T12:00:00.000Z");

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = limiter.recordFailure({
      userId: `user-${attempt}`,
      ipAddress: "203.0.113.20",
      now,
    });
    assert.equal(result.locked, false);
  }

  const locked = limiter.recordFailure({
    userId: "user-11",
    ipAddress: "203.0.113.20",
    now,
  });

  assert.equal(locked.locked, true);
  assert.equal(locked.retryAfterSeconds, 30 * 60);
});
