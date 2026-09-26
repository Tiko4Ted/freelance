import assert from "node:assert/strict";
import test from "node:test";

import { createRegisterPostHandler } from "../lib/http/register-route-handler";
import { createVerifyEmailPostHandler } from "../lib/http/verify-email-route-handler";
import {
  buildEmailVerificationUrl,
  hashEmailVerificationToken,
} from "../lib/services/email-verification-service";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const registrationInput = {
  email: "new.user@example.test",
  name: "New User",
  password: "secure-password",
};

test("registration sends a welcome verification email", async () => {
  let deliveredTo = "";
  const handler = createRegisterPostHandler({
    register: async (input) => ({
      id: "user-1",
      email: input.email,
      name: input.name,
    }),
    sendWelcomeVerification: async (user) => {
      deliveredTo = user.email;
    },
  });

  const response = await handler(
    jsonRequest("https://example.test/api/v1/auth/register", registrationInput),
  );

  assert.equal(response.status, 201);
  assert.equal(deliveredTo, registrationInput.email);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    verificationEmailSent: true,
  });
});

test("registration reports delivery failure without deleting the account", async () => {
  const handler = createRegisterPostHandler({
    register: async (input) => ({
      id: "user-1",
      email: input.email,
      name: input.name,
    }),
    sendWelcomeVerification: async () => {
      throw new Error("provider rejected message");
    },
  });

  const response = await handler(
    jsonRequest("https://example.test/api/v1/auth/register", registrationInput),
  );

  assert.equal(response.status, 201);
  assert.equal((await response.json()).verificationEmailSent, false);
});

test("verification endpoint maps valid, expired, and reused tokens", async () => {
  const token = "a".repeat(43);
  const verified = createVerifyEmailPostHandler({
    verifyToken: async () => "verified",
  });
  const expired = createVerifyEmailPostHandler({
    verifyToken: async () => "expired",
  });
  const invalid = createVerifyEmailPostHandler({
    verifyToken: async () => "invalid",
  });

  const verifiedResponse = await verified(
    jsonRequest("https://example.test/api/v1/auth/verify-email", { token }),
  );
  const expiredResponse = await expired(
    jsonRequest("https://example.test/api/v1/auth/verify-email", { token }),
  );
  const invalidResponse = await invalid(
    jsonRequest("https://example.test/api/v1/auth/verify-email", { token }),
  );

  assert.equal(verifiedResponse.status, 200);
  assert.equal(verifiedResponse.headers.get("cache-control"), "no-store");
  assert.equal(expiredResponse.status, 410);
  assert.equal(invalidResponse.status, 400);
});

test("verification tokens are hashed and links use the configured app URL", () => {
  const originalAppUrl = process.env.APP_URL;
  process.env.APP_URL = "https://example.test/";

  try {
    const token = "a".repeat(43);
    const hash = hashEmailVerificationToken(token);

    assert.equal(hash.length, 64);
    assert.notEqual(hash, token);
    assert.equal(
      buildEmailVerificationUrl(token),
      `https://example.test/verify-email?token=${token}`,
    );
  } finally {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
  }
});
