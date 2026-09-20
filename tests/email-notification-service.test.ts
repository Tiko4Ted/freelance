import assert from "node:assert/strict";
import test from "node:test";

import { ApplicationStatus } from "@prisma/client";

import {
  buildApplicationStatusEmail,
  buildNewJobEmail,
} from "../lib/services/email-notification-service";

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
