import assert from "node:assert/strict";
import test from "node:test";

import {
  emailNotificationMessageSchema,
  phoneVerificationMessageSchema,
} from "../lib/queues/notification-queue";

const jobId = "123e4567-e89b-42d3-a456-426614174000";
const userId = "123e4567-e89b-42d3-a456-426614174001";

test("accepts a strict six-digit phone queue message", () => {
  const message = phoneVerificationMessageSchema.parse({
    jobId,
    type: "phone-verification",
    userId,
    to: "+254712345678",
    code: "381204",
    codeHash: "a".repeat(64),
    expiresAt: "2026-09-26T12:10:00.000Z",
  });

  assert.equal(message.code, "381204");
  assert.throws(() =>
    phoneVerificationMessageSchema.parse({ ...message, code: "38120" }),
  );
  assert.throws(() =>
    phoneVerificationMessageSchema.parse({ ...message, code: "38120A" }),
  );
});

test("requires token identity on queued onboarding emails", () => {
  const parsed = emailNotificationMessageSchema.parse({
    jobId,
    type: "welcome-verification",
    userId,
    tokenHash: "b".repeat(64),
    name: "Ada",
    to: "ada@example.test",
    verificationUrl: "https://example.test/verify-email?token=secure",
  });

  assert.equal(parsed.type, "welcome-verification");
  assert.throws(() =>
    emailNotificationMessageSchema.parse({
      ...parsed,
      tokenHash: "plaintext-token",
    }),
  );
});
