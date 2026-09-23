import assert from "node:assert/strict";
import test from "node:test";

import { ForbiddenError, UnauthorizedError } from "../lib/auth/session";
import { createAdminEmailTestPostHandler } from "../lib/http/admin-email-test-route-handler";

function jsonRequest(body: unknown) {
  return new Request("https://example.test/api/v1/admin/email/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("admin email test endpoint sends the fixed template", async () => {
  let recipient = "";
  const handler = createAdminEmailTestPostHandler({
    requireAdmin: async () => ({ user: { id: "admin-1" } }),
    sendTestEmail: async (to) => {
      recipient = to;
      return { id: "email-123", status: "sent" };
    },
  });

  const response = await handler(jsonRequest({ to: " TIKO4TED@GMAIL.COM " }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(recipient, "tiko4ted@gmail.com");
  assert.deepEqual(await response.json(), {
    accepted: true,
    deliveryId: "email-123",
    to: "tiko4ted@gmail.com",
  });
});

test("admin email test endpoint rejects unauthenticated and non-admin users", async () => {
  const unauthorized = createAdminEmailTestPostHandler({
    requireAdmin: async () => {
      throw new UnauthorizedError();
    },
    sendTestEmail: async () => ({ id: null, status: "sent" }),
  });
  const forbidden = createAdminEmailTestPostHandler({
    requireAdmin: async () => {
      throw new ForbiddenError();
    },
    sendTestEmail: async () => ({ id: null, status: "sent" }),
  });

  const unauthorizedResponse = await unauthorized(
    jsonRequest({ to: "candidate@example.test" }),
  );
  const forbiddenResponse = await forbidden(
    jsonRequest({ to: "candidate@example.test" }),
  );

  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(forbiddenResponse.status, 403);
});

test("admin email test endpoint validates input before sending", async () => {
  let sendCount = 0;
  const handler = createAdminEmailTestPostHandler({
    requireAdmin: async () => ({ user: { id: "admin-1" } }),
    sendTestEmail: async () => {
      sendCount += 1;
      return { id: null, status: "sent" };
    },
  });

  const response = await handler(jsonRequest({ to: "not-an-email" }));

  assert.equal(response.status, 400);
  assert.equal(sendCount, 0);
});

test("admin email test endpoint maps provider failures without leaking details", async () => {
  const handler = createAdminEmailTestPostHandler({
    requireAdmin: async () => ({ user: { id: "admin-1" } }),
    sendTestEmail: async () => {
      throw new Error("provider response containing private details");
    },
  });

  const response = await handler(
    jsonRequest({ to: "candidate@example.test" }),
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Email provider rejected the test message",
  });
});
