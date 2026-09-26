import assert from "node:assert/strict";
import test from "node:test";

import { Role } from "@prisma/client";

import { createCredentialVerifier } from "../lib/services/auth-service";

const credentials = {
  email: "person@example.test",
  password: "correct-password",
};

const baseUser = {
  id: "user-1",
  email: "person@example.test",
  name: "Verified Person",
  role: Role.REFERRER,
  referralCode: "referral-1",
  passwordHash: "stored-password-hash",
};

test("rejects correct credentials until the email is verified", async () => {
  const verifyCredentials = createCredentialVerifier({
    findUserByEmail: async () => ({
      ...baseUser,
      emailVerifiedAt: null,
    }),
    comparePassword: async () => true,
  });

  assert.equal(await verifyCredentials(credentials), null);
});

test("accepts correct credentials after email verification", async () => {
  let normalizedEmail = "";
  const verifyCredentials = createCredentialVerifier({
    findUserByEmail: async (email) => {
      normalizedEmail = email;
      return {
        ...baseUser,
        emailVerifiedAt: new Date("2026-09-26T00:00:00.000Z"),
      };
    },
    comparePassword: async (password, passwordHash) =>
      password === credentials.password &&
      passwordHash === baseUser.passwordHash,
  });

  const user = await verifyCredentials({
    ...credentials,
    email: "  PERSON@EXAMPLE.TEST ",
  });

  assert.equal(normalizedEmail, "person@example.test");
  assert.deepEqual(user, {
    id: baseUser.id,
    email: baseUser.email,
    name: baseUser.name,
    role: baseUser.role,
  });
});

test("rejects an incorrect password for a verified email", async () => {
  const verifyCredentials = createCredentialVerifier({
    findUserByEmail: async () => ({
      ...baseUser,
      emailVerifiedAt: new Date("2026-09-26T00:00:00.000Z"),
    }),
    comparePassword: async () => false,
  });

  assert.equal(await verifyCredentials(credentials), null);
});
