import assert from "node:assert/strict";
import test from "node:test";

import { ApplicationStatus, PayoutTrigger, Role } from "@prisma/client";

import { prisma } from "../lib/db/prisma";
import {
  getReferralAttributionCookieValue,
  getReferralCodeFromCookie,
  getReferralCookieValue,
} from "../lib/referral-cookie";
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
  showOnHome: true,
  openings: 1,
  skills: [{ label: "TypeScript" }, { label: "Testing" }],
};

function applicationInput(jobId = job.id): ApplicationInput {
  return {
    jobId,
    candidateName: "Ada Candidate",
    candidateFirstName: "Ada",
    candidateLastName: "Candidate",
    candidateLinkedinUrl: "https://www.linkedin.com/in/ada-candidate",
    resumeFileName: "ada-candidate.pdf",
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
    remainingOpenings?: number;
    existingApplicationStatus?: ApplicationStatus;
    applicantReferredById?: string;
  },
  run: (captured: CapturedApplication[]) => Promise<void>,
) {
  const originalTransaction = prisma.$transaction;
  const originalNotification =
    EmailNotificationService.notifyApplicationSubmitted;
  const captured: CapturedApplication[] = [];
  const jobs = options.jobs ?? [job];
  let remainingOpenings = options.remainingOpenings ?? 10;

  const transactionClient = {
    job: {
      findFirst: async ({ where }: { where: { id: string } }) =>
        jobs.find((candidateJob) => candidateJob.id === where.id) ?? null,
      updateMany: async () => {
        if (remainingOpenings <= 0) {
          return { count: 0 };
        }

        remainingOpenings -= 1;
        return { count: 1 };
      },
    },
    application: {
      findFirst: async ({
        where,
      }: {
        where: { status?: { in?: ApplicationStatus[] } };
      }) =>
        options.existingApplicationStatus &&
        where.status?.in?.includes(options.existingApplicationStatus)
          ? { id: "existing-application", job: { title: "Pending Task" } }
          : null,
      create: async ({ data }: { data: CapturedApplication }) => {
        captured.push({ ...data });
        return {
          ...data,
          id: `application-${captured.length}`,
          candidateEmail: applicant.email.toLowerCase(),
          candidateFirstName: data.candidateFirstName ?? null,
          candidateLastName: data.candidateLastName ?? null,
          candidatePhoneCountry: null,
          candidatePhoneCountryCode: data.candidatePhoneCountryCode ?? null,
          candidatePhoneNumber: data.candidatePhoneNumber ?? null,
          candidateLinkedinUrl: data.candidateLinkedinUrl ?? null,
          resumeFileName: data.resumeFileName ?? null,
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
      findUnique: async ({ where }: { where: { id?: string } }) =>
        where.id === applicant.id
          ? {
              name: "Verified Database Name",
              referredById: options.applicantReferredById ?? null,
              onboarding: {
                identityLegalName: "Verified Database Name",
                phoneCountryCode: "+254",
                phoneNumber: "712345678",
                phoneVerifiedAt: new Date("2026-09-22T00:00:00.000Z"),
              },
            }
          : options.referrer ?? null,
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

test("referral attribution persists without requiring a job path", () => {
  const first = getReferralAttributionCookieValue({
    referralCode: "FIRST",
  });
  const second = getReferralAttributionCookieValue({
    referralCode: "SECOND",
    existingCookieValue: first ?? undefined,
  });

  assert.equal(first, "FIRST");
  assert.equal(second, null);
  assert.equal(getReferralCodeFromCookie("job-123:FIRST"), "FIRST");
  assert.equal(getReferralCodeFromCookie("FIRST"), "FIRST");
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

test("application identity and phone come from verified onboarding data", async () => {
  await withApplicationDatabase({}, async (captured) => {
    await ApplicationService.submitApplication(
      {
        ...applicationInput(),
        candidateName: "Spoofed Name",
        candidateFirstName: "Spoofed",
        candidateLastName: "Name",
        candidatePhoneCountryCode: "+1",
        candidatePhoneNumber: "5550000000",
      },
      applicant,
    );

    assert.equal(captured[0]?.candidateName, "Verified Database Name");
    assert.equal(captured[0]?.candidateFirstName, "Verified");
    assert.equal(captured[0]?.candidateLastName, "Database Name");
    assert.equal(captured[0]?.candidatePhoneCountryCode, "+254");
    assert.equal(captured[0]?.candidatePhoneNumber, "712345678");
  });
});

test("non-home applications stay pending for manual admin approval", async () => {
  const manualJob = {
    ...job,
    id: "33333333-3333-4333-8333-333333333333",
    title: "Manual Approval Role",
    showOnHome: false,
  };

  await withApplicationDatabase({ jobs: [manualJob] }, async (captured) => {
    const application = await ApplicationService.submitApplication(
      applicationInput(manualJob.id),
      applicant,
    );

    assert.equal(application.status, "APPLIED");
    assert.equal(captured.length, 1);
  });
});

test("pending task applications do not block home project applications", async () => {
  await withApplicationDatabase(
    { existingApplicationStatus: ApplicationStatus.APPLIED },
    async (captured) => {
      const application = await ApplicationService.submitApplication(
        applicationInput(),
        applicant,
      );

      assert.equal(application.status, "CERTIFIED");
      assert.equal(captured.length, 1);
    },
  );
});

test("signup attribution is used when the application has no referral cookie", async () => {
  const referrer = {
    id: "referrer-user",
    email: "referrer@example.test",
    role: Role.REFERRER,
  };

  await withApplicationDatabase(
    {
      referrer,
      applicantReferredById: referrer.id,
    },
    async (captured) => {
      const application = await ApplicationService.submitApplication(
        applicationInput(),
        applicant,
      );

      assert.ok(application.referralId);
      assert.equal(captured[0]?.referralId, application.referralId);
    },
  );
});

test("participant capacity is reserved before a certified application is created", async () => {
  await withApplicationDatabase(
    { remainingOpenings: 0 },
    async (captured) => {
      await assert.rejects(
        ApplicationService.submitApplication(applicationInput(), applicant),
        /PROJECT_FULL/,
      );
      assert.equal(captured.length, 0);
    },
  );
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
