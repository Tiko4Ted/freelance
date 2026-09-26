import assert from "node:assert/strict";
import test from "node:test";

import { Role } from "@prisma/client";
import type { JWT } from "next-auth/jwt";

import { validatePersistedSessionToken } from "../lib/auth/session-token";

test("invalidates a persisted session after its user is deleted", async () => {
  const token: JWT = {
    email: "deleted@example.test",
    id: "deleted-user",
    name: "Deleted User",
    role: Role.REFERRER,
  };

  const validated = await validatePersistedSessionToken(token, async () => null);

  assert.equal(validated, null);
});

test("refreshes persisted session claims from the active user", async () => {
  const token: JWT = {
    email: "old@example.test",
    id: "active-user",
    name: "Old Name",
    role: Role.REFERRER,
  };

  const validated = await validatePersistedSessionToken(token, async (userId) => ({
    email: "current@example.test",
    emailVerifiedAt: new Date("2026-09-26T00:00:00.000Z"),
    id: userId,
    name: "Current Name",
    role: Role.CANDIDATE,
  }));

  assert.deepEqual(validated, {
    email: "current@example.test",
    id: "active-user",
    name: "Current Name",
    role: Role.CANDIDATE,
  });
});

test("invalidates a persisted session when the email is unverified", async () => {
  const token: JWT = {
    email: "pending@example.test",
    id: "pending-user",
    name: "Pending User",
    role: Role.REFERRER,
  };

  const validated = await validatePersistedSessionToken(token, async (userId) => ({
    email: "pending@example.test",
    emailVerifiedAt: null,
    id: userId,
    name: "Pending User",
    role: Role.REFERRER,
  }));

  assert.equal(validated, null);
});

test("leaves tokens without a persisted user id unchanged", async () => {
  const token: JWT = { email: "anonymous@example.test" };
  let lookupCalled = false;

  const validated = await validatePersistedSessionToken(token, async () => {
    lookupCalled = true;
    return null;
  });

  assert.equal(validated, token);
  assert.equal(lookupCalled, false);
});
