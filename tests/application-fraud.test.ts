import assert from "node:assert/strict";
import test from "node:test";

import { PayoutTrigger, Role } from "@prisma/client";

import { prisma } from "../lib/db/prisma";
import { getReferralCookieValue } from "../lib/referral-cookie";
import { ApplicationService } from "../lib/services/application-service";
import { EmailNotificationService } from "../lib/services/email-notification-service";
import type { ApplicationInput } from "../lib/validation/application";

const applicant = {
  id: "candidate-user",
  email: "Candidate@Example.test",
};

const job = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Software Quality Reviewer",
  description: "Review TypeScript changes and document test evidence.",
  payoutAmountCents: 2500,
  payoutType: PayoutTrigger.TASK_1,
  skills: [{ label: "TypeScript" }, { label: "Testing" }],
};

function applicationInput(jobId = job.id): ApplicationInput {
  return {
    jobId,
    candidateName: "Ada Candidate",
    candidateFirstName: "Ada",
    candidateLastName: "Candidate",
    strongestTools: ["TypeScript"],
    aptitudeAnswers: Array.from({ length: 15 }, (_, index) => ({
      questionId: [
        "role-focus",
        "work-start",
        "quality-response",
        "domain-output",
        "completion-check",
        "instruction-priority",
        "evidence-quality",
        "time-management",
        "tool-fit",
        "communication-update",
        "confidentiality",
        "revision-response",
        "file-readiness",
        "quality-standard",
        "submission-readiness",
      ][index],
      selectedOptionId: index < 12 ? "a" : "b",
    })),
  };
}

type CapturedApplication = Record<string, unknown> & {
  referralId?: string;
  lockedPayoutCents?: number;
};

async function withApplicationDatabase(
  options: {
    referrer?: { id: string; email: string; role: Role } | null;
    jobs?: typeof job[];
  },
  run: (captured: CapturedApplication[]) => Promise<void>,
) {
  const originalTransaction = prisma.$transaction;
  const originalNotification =
    EmailNotificationService.notifyApplicationSubmitted;
  const captured: CapturedApplication[] = [];
  const jobs = options.jobs ?? [job];

  const transactionClient = {
    job: {
      findFirst: async ({ where }: { where: { id: string } }) =>
        jobs.find((candidateJob) => candidateJob.id === where.id) ?? null,
    },
    application: {
      findFirst: async () => null,
      create: async ({ data }: { data: CapturedApplication }) => {
        captured.push({ ...data });
        return {
          ...data,
          id: `application-${captured.length}`,
          candidateEmail: applicant.email.toLowerCase(),
          candidateFirstName: data.candidateFirstName ?? null,
          candidateLastName: data.candidateLastName ?? null,
          candidatePhoneCountry: null,
          candidatePhoneCountryCode: null,
          candidatePhoneNumber: null,
          candidateLinkedinUrl: null,
          resumeFileName: null,
          startAvailabilityDays: null,
          expectedHourlyRateUsd: null,
          weeklyAvailabilityHours: null,
          strongestTools: data.strongestTools ?? [],
          aptitudeSubmittedAt: new Date("2026-09-22T00:00:00.000Z"),
          referralId: data.referralId ?? null,
          createdAt: new Date("2026-09-22T00:00:00.000Z"),
        };
      },
    },
    candidateIdentity: {
      upsert: async () => ({}),
    },
    user: {
      findUnique: async () => options.referrer ?? null,
    },
    referral: {
      create: async () => ({ id: `referral-${captured.length + 1}` }),
    },
  };

  Object.defineProperty(prisma, "$transaction", {
    configurable: true,
    value: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient),
  });
  EmailNotificationService.notifyApplicationSubmitted = async () => undefined;

  try {
    await run(captured);
  } finally {
    Object.defineProperty(prisma, "$transaction", {
      configurable: true,
      value: originalTransaction,
    });
    EmailNotificationService.notifyApplicationSubmitted = originalNotification;
  }
}

test("first referral click wins and later clicks cannot overwrite the cookie", () => {
  const first = getReferralCookieValue({
    pathname: `/jobs/${job.id}`,
    referralCode: "FIRST",
  });
  const second = getReferralCookieValue({
    pathname: `/jobs/${job.id}`,
    referralCode: "SECOND",
    existingCookieValue: first ?? undefined,
  });

  assert.equal(first, `${job.id}:FIRST`);
  assert.equal(second, null);
});

test("self-referral is blocked transactionally", async () => {
  await withApplicationDatabase(
    {
      referrer: {
        id: applicant.id,
        email: applicant.email.toLowerCase(),
        role: Role.REFERRER,
      },
    },
    async (captured) => {
      await assert.rejects(
        ApplicationService.submitApplication(
          applicationInput(),
          applicant,
          `${job.id}:SELF`,
        ),
        /SELF_REFERRAL/,
      );
      assert.equal(captured.length, 0);
    },
  );
});

test("application without a referral cookie creates no referral", async () => {
  await withApplicationDatabase({}, async (captured) => {
    const application = await ApplicationService.submitApplication(
      applicationInput(),
      applicant,
    );

    assert.equal(application.referralId, null);
    assert.equal(captured[0]?.referralId, undefined);
  });
});

test("job-specific attribution remains isolated and payout amounts are snapshotted", async () => {
  const secondJob = {
    ...job,
    id: "22222222-2222-4222-8222-222222222222",
    title: "Second Software Role",
    payoutAmountCents: 9000,
  };

  await withApplicationDatabase(
    {
      jobs: [job, secondJob],
      referrer: {
        id: "referrer-user",
        email: "referrer@example.test",
        role: Role.REFERRER,
      },
    },
    async (captured) => {
      const first = await ApplicationService.submitApplication(
        applicationInput(job.id),
        applicant,
        `${job.id}:REFERRER`,
      );
      const second = await ApplicationService.submitApplication(
        applicationInput(secondJob.id),
        applicant,
      );

      assert.equal(first.referralId, "referral-1");
      assert.equal(second.referralId, null);
      assert.equal(captured[0]?.lockedPayoutCents, 2500);
      assert.equal(captured[1]?.lockedPayoutCents, 9000);

      secondJob.payoutAmountCents = 12000;
      assert.equal(captured[1]?.lockedPayoutCents, 9000);
    },
  );
});
