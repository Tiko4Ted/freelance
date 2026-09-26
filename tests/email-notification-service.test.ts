import assert from "node:assert/strict";
import test from "node:test";

import { ApplicationStatus } from "@prisma/client";

import {
  buildEmailDeliveryTestEmail,
  buildApplicationStatusEmail,
  buildNewJobEmail,
  buildSignedLegalDocumentEmail,
  buildWelcomeVerificationEmail,
  EmailNotificationService,
} from "../lib/services/email-notification-service";

function assertStructurallyValidPdf(pdf: Buffer) {
  const text = pdf.toString("latin1");

  assert.match(text, /^%PDF-1\.4\n/);
  assert.match(text, /\/Kids \[(?:\d+ 0 R ?)+\]/);

  const startXrefMatch = /startxref\n(\d+)\n%%EOF\n$/.exec(text);
  assert.ok(startXrefMatch, "PDF must contain a startxref pointer");

  const xrefOffset = Number(startXrefMatch[1]);
  assert.equal(text.slice(xrefOffset, xrefOffset + 5), "xref\n");

  const xrefMatch = /xref\n0 (\d+)\n([\s\S]+?)trailer\n/.exec(
    text.slice(xrefOffset),
  );
  assert.ok(xrefMatch, "PDF must contain a complete cross-reference table");

  const objectCount = Number(xrefMatch[1]);
  const entries = xrefMatch[2].trim().split("\n");
  assert.equal(entries.length, objectCount);
  assert.match(entries[0], /^0000000000 65535 f/);

  for (let objectId = 1; objectId < objectCount; objectId += 1) {
    const objectOffset = Number(entries[objectId].slice(0, 10));
    const objectHeader = `${objectId} 0 obj`;
    assert.equal(
      text.slice(objectOffset, objectOffset + objectHeader.length),
      objectHeader,
    );
  }
}

test("builds a combined welcome and verification email", () => {
  const email = buildWelcomeVerificationEmail({
    name: "Ada",
    to: "ada@example.test",
    verificationUrl: "https://example.test/verify-email?token=secure-token",
  });

  assert.equal(email.to, "ada@example.test");
  assert.match(email.subject, /Welcome.*verify your email/);
  assert.match(email.text, /expires in 24 hours/);
  assert.match(email.html, /Verify email/);
  assert.match(email.html, /secure-token/);
});

test("builds a signed legal email with a PDF copy", () => {
  const email = buildSignedLegalDocumentEmail({
    document: "nda",
    name: "Ada",
    signedAt: "2026-09-26T12:00:00.000Z",
    signerName: "Ada Lovelace",
    signerTitle: "Consultant",
    signatureText: "Ada Lovelace",
    to: "ada@example.test",
  });

  assert.equal(email.to, "ada@example.test");
  assert.match(email.subject, /signed Non-Disclosure Agreement/);
  assert.equal(email.attachments?.length, 1);
  assert.match(email.attachments?.[0]?.filename ?? "", /NDA.*\.pdf$/);
  assert.equal(email.attachments?.[0]?.content_type, "application/pdf");
  assertStructurallyValidPdf(
    Buffer.from(email.attachments?.[0]?.content ?? "", "base64"),
  );
});

test("uses the notification job id as Resend's idempotency key", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  let idempotencyKey: string | null = null;
  let requestBody: Record<string, unknown> | undefined;

  process.env.RESEND_API_KEY = "test-key";
  globalThis.fetch = async (_input, init) => {
    idempotencyKey = new Headers(init?.headers).get("Idempotency-Key");
    requestBody = JSON.parse(String(init?.body));
    return Response.json({ id: "email-legal-123" });
  };

  try {
    await EmailNotificationService.sendSignedLegalDocumentEmail(
      {
        document: "dataSubmission",
        name: "Ada",
        signedAt: "2026-09-26T12:00:00.000Z",
        signerName: "Ada Lovelace",
        signerTitle: "Consultant",
        signatureText: "Ada Lovelace",
        to: "ada@example.test",
      },
      "job-123",
    );

    assert.equal(idempotencyKey, "job-123");
    assert.equal(Array.isArray(requestBody?.attachments), true);
    const attachments = requestBody?.attachments as Array<
      Record<string, unknown>
    >;
    assert.equal(attachments[0]?.content_type, "application/pdf");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }
  }
});

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
