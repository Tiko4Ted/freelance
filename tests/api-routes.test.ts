import assert from "node:assert/strict";
import test from "node:test";

import { GET as getJobs } from "../app/api/v1/jobs/route";
import { createApplicationPostHandler } from "../lib/http/application-route-handler";
import { createWithdrawalHandlers } from "../lib/http/withdrawal-route-handler";
import { JobService } from "../lib/services/job-service";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validApplication = {
  jobId: "11111111-1111-4111-8111-111111111111",
  candidateName: "Ada Candidate",
  strongestTools: ["TypeScript"],
  aptitudeAnswers: Array.from({ length: 15 }, (_, index) => ({
    questionId: `question-${index + 1}`,
    selectedOptionId: "a",
  })),
};

test("applications API validates input and returns a created application", async () => {
  let submittedReferral: string | undefined;
  const handler = createApplicationPostHandler({
    requireSession: async () => ({
      user: { id: "candidate-user", email: "candidate@example.test" },
    }),
    readReferralCookie: async () => "job-id:REFERRER",
    submitApplication: async (_input, _applicant, referralCookie) => {
      submittedReferral = referralCookie;
      return { id: "application-1", status: "CERTIFIED" };
    },
  });

  const invalidResponse = await handler(
    jsonRequest("https://example.test/api/v1/applications", {
      jobId: "not-a-uuid",
    }),
  );
  const successResponse = await handler(
    jsonRequest(
      "https://example.test/api/v1/applications",
      validApplication,
    ),
  );

  assert.equal(invalidResponse.status, 400);
  assert.equal(successResponse.status, 201);
  assert.equal(submittedReferral, "job-id:REFERRER");
  assert.deepEqual(await successResponse.json(), {
    application: { id: "application-1", status: "CERTIFIED" },
  });
});

test("applications API maps authentication and fraud failures", async () => {
  const unauthorized = createApplicationPostHandler({
    requireSession: async () => {
      throw new Error("UNAUTHORIZED");
    },
    readReferralCookie: async () => undefined,
    submitApplication: async () => ({}),
  });
  const selfReferral = createApplicationPostHandler({
    requireSession: async () => ({
      user: { id: "candidate-user", email: "candidate@example.test" },
    }),
    readReferralCookie: async () => "job-id:SELF",
    submitApplication: async () => {
      throw new Error("SELF_REFERRAL");
    },
  });

  const unauthorizedResponse = await unauthorized(
    jsonRequest(
      "https://example.test/api/v1/applications",
      validApplication,
    ),
  );
  const fraudResponse = await selfReferral(
    jsonRequest(
      "https://example.test/api/v1/applications",
      validApplication,
    ),
  );

  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(fraudResponse.status, 400);
  assert.deepEqual(await fraudResponse.json(), {
    error: "Self-referrals are not eligible",
  });
});

test("applications API reports a full project as a conflict", async () => {
  const handler = createApplicationPostHandler({
    requireSession: async () => ({
      user: { id: "candidate-user", email: "candidate@example.test" },
    }),
    readReferralCookie: async () => undefined,
    submitApplication: async () => {
      throw new Error("PROJECT_FULL");
    },
  });

  const response = await handler(
    jsonRequest("https://example.test/api/v1/applications", validApplication),
  );

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), {
    error: "This project has reached its participant limit",
  });
});

test("withdrawals API covers authentication, validation, readiness, and success", async () => {
  const unauthorizedHandlers = createWithdrawalHandlers({
    requireSession: async () => {
      throw new Error("UNAUTHORIZED");
    },
    listWithdrawals: async () => [],
    requestWithdrawal: async () => ({}),
  });
  const readyHandlers = createWithdrawalHandlers({
    requireSession: async () => ({ user: { id: "user-1" } }),
    listWithdrawals: async () => [{ id: "withdrawal-1" }],
    requestWithdrawal: async (_userId, input) => ({
      id: "withdrawal-1",
      amountCents: input.amountCents,
    }),
  });
  const notReadyHandlers = createWithdrawalHandlers({
    requireSession: async () => ({ user: { id: "user-1" } }),
    listWithdrawals: async () => [],
    requestWithdrawal: async () => {
      throw new Error("PAYOUT_ACCOUNT_NOT_READY");
    },
  });

  const unauthorizedResponse = await unauthorizedHandlers.GET();
  const invalidResponse = await readyHandlers.POST(
    jsonRequest("https://example.test/api/v1/withdrawals", {
      amountCents: -1,
    }),
  );
  const notReadyResponse = await notReadyHandlers.POST(
    jsonRequest("https://example.test/api/v1/withdrawals", {
      amountCents: 1000,
      payoutMethod: "PAYPAL",
      destinationDetails: "ada@example.test",
    }),
  );
  const successResponse = await readyHandlers.POST(
    jsonRequest("https://example.test/api/v1/withdrawals", {
      amountCents: 1000,
      payoutMethod: "PAYPAL",
      destinationDetails: "ada@example.test",
    }),
  );

  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(invalidResponse.status, 400);
  assert.equal(notReadyResponse.status, 409);
  assert.equal(successResponse.status, 201);
  assert.deepEqual(await successResponse.json(), {
    withdrawal: { id: "withdrawal-1", amountCents: 1000 },
  });
});

test("public jobs API returns the service payload", async () => {
  const originalListActiveJobs = JobService.listActiveJobs;
  JobService.listActiveJobs = async () => [
    {
      id: "job-1",
      title: "AI Reviewer",
    },
  ] as Awaited<ReturnType<typeof JobService.listActiveJobs>>;

  try {
    const response = await getJobs();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      jobs: [{ id: "job-1", title: "AI Reviewer" }],
    });
  } finally {
    JobService.listActiveJobs = originalListActiveJobs;
  }
});
