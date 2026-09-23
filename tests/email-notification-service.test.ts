import assert from "node:assert/strict";
import test from "node:test";

import { ApplicationStatus } from "@prisma/client";

import {
  buildEmailDeliveryTestEmail,
  buildApplicationStatusEmail,
  buildNewJobEmail,
  EmailNotificationService,
} from "../lib/services/email-notification-service";

test("builds a fixed delivery test email for the requested recipient", () => {
  const email = buildEmailDeliveryTestEmail("admin@example.test");

  assert.equal(email.to, "admin@example.test");
  assert.equal(email.subject, "Trinity-AI email delivery test");
  assert.match(email.text, /production email delivery/);
  assert.match(email.html, /Email delivery is working/);
});

test("submits the delivery test email to Resend and returns its id", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  let requestBody: Record<string, unknown> | undefined;

  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "Trinity-AI <mail@example.test>";
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return Response.json({ id: "email-123" });
  };

  try {
    const result = await EmailNotificationService.sendTestEmail(
      "admin@example.test",
    );

    assert.deepEqual(result, { id: "email-123", status: "sent" });
    assert.deepEqual(requestBody?.to, "admin@example.test");
    assert.equal(requestBody?.from, "Trinity-AI <mail@example.test>");
    assert.equal(requestBody?.subject, "Trinity-AI email delivery test");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }
    if (originalFrom === undefined) {
      delete process.env.EMAIL_FROM;
    } else {
      process.env.EMAIL_FROM = originalFrom;
    }
  }
});

test("builds a new project email with the job apply link", () => {
  process.env.APP_URL = "https://example.test";

  const email = buildNewJobEmail(
    {
      companyName: "Trinity-AI",
      currency: "USD",
      description: "Review AI project outputs.",
      id: "job-123",
      payoutAmountCents: 1000,
      skills: [{ label: "Research" }, { label: "Writing" }],
      title: "AI Reviewer",
    },
    { email: "candidate@example.test", name: "Ada" },
  );

  assert.equal(email.to, "candidate@example.test");
  assert.equal(email.subject, "New Trinity-AI project: AI Reviewer");
  assert.match(email.html, /https:\/\/example\.test\/jobs\/job-123\/apply/);
  assert.match(email.text, /Apply here: https:\/\/example\.test\/jobs\/job-123\/apply/);
});

test("builds an application status email with the previous and new status", () => {
  process.env.APP_URL = "https://example.test";

  const email = buildApplicationStatusEmail(
    {
      candidateEmail: "candidate@example.test",
      candidateName: "Ada Candidate",
      id: "application-123",
      job: {
        companyName: "Trinity-AI",
        id: "job-123",
        title: "AI Reviewer",
      },
      status: ApplicationStatus.ACTIVE,
    },
    ApplicationStatus.MATCHED,
  );

  assert.equal(email.to, "candidate@example.test");
  assert.match(email.subject, /Application update/);
  assert.match(email.text, /Previous status: Matched/);
  assert.match(email.text, /New status: Active/);
  assert.match(email.html, /Open dashboard/);
});
