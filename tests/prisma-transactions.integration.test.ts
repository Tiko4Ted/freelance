import assert from "node:assert/strict";
import test from "node:test";

import {
  ApplicationStatus,
  LedgerAccount,
  PayoutTrigger,
  PrismaClient,
  Role,
} from "@prisma/client";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const isDedicatedTestDatabase = Boolean(
  testDatabaseUrl &&
    /(?:localhost|127\.0\.0\.1)/.test(testDatabaseUrl) &&
    /test/i.test(testDatabaseUrl),
);

test(
  "Prisma transactions preserve attribution, single payout, and withdrawal balances",
  { skip: !isDedicatedTestDatabase },
  async () => {
    if (!testDatabaseUrl) {
      return;
    }

    process.env.DATABASE_URL = testDatabaseUrl;
    const client = new PrismaClient({
      datasources: { db: { url: testDatabaseUrl } },
    });
    const suffix = `${process.pid}-${Date.now()}`;
    const referrerId = `integration-referrer-${suffix}`;
    const candidateId = `integration-candidate-${suffix}`;
    const candidateEmail = `candidate-${suffix}@example.test`;
    const matchedEmail = `matched-${suffix}@example.test`;
    const firstJobId = `integration-job-a-${suffix}`;
    const secondJobId = `integration-job-b-${suffix}`;
    const firstApplicationId = `integration-application-a-${suffix}`;
    const secondApplicationId = `integration-application-b-${suffix}`;

    const { ApplicationService } = await import(
      "../lib/services/application-service"
    );
    const { EmailNotificationService } = await import(
      "../lib/services/email-notification-service"
    );
    const { PayoutEligibilityService } = await import(
      "../lib/services/payout-eligibility-service"
    );
    const { WithdrawalService } = await import(
      "../lib/services/withdrawal-service"
    );
    const originalSubmittedNotification =
      EmailNotificationService.notifyApplicationSubmitted;
    EmailNotificationService.notifyApplicationSubmitted = async () => undefined;

    const questionIds = [
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
    ];
    const aptitudeAnswers = questionIds.map((questionId, index) => ({
      questionId,
      selectedOptionId: index < 12 ? "a" : "b",
    }));

    try {
      await client.user.createMany({
        data: [
          {
            id: referrerId,
            email: `referrer-${suffix}@example.test`,
            passwordHash: "integration-test",
            name: "Integration Referrer",
            role: Role.REFERRER,
            referralCode: `REF-${suffix}`,
            payoutProvider: "mock",
            payoutAccountId: `mock-${suffix}`,
            payoutAccountReady: true,
          },
          {
            id: candidateId,
            email: candidateEmail,
            passwordHash: "integration-test",
            name: "Integration Candidate",
            role: Role.CANDIDATE,
            referralCode: `CANDIDATE-${suffix}`,
          },
        ],
      });
      await client.job.createMany({
        data: [
          {
            id: firstJobId,
            title: `Integration Software Role A ${suffix}`,
            description: "Review TypeScript changes and test the final output.",
            payoutAmountCents: 2500,
            payoutType: PayoutTrigger.HOURS_10,
          },
          {
            id: secondJobId,
            title: `Integration Software Role B ${suffix}`,
            description: "Review TypeScript changes and test the final output.",
            payoutAmountCents: 9000,
            payoutType: PayoutTrigger.HOURS_10,
          },
        ],
      });

      const attributed = await ApplicationService.submitApplication(
        {
          jobId: firstJobId,
          candidateName: "Integration Candidate",
          strongestTools: ["TypeScript"],
          aptitudeAnswers,
        },
        { id: candidateId, email: candidateEmail },
        `${firstJobId}:REF-${suffix}`,
      );
      await client.job.update({
        where: { id: firstJobId },
        data: { payoutAmountCents: 7777 },
      });
      await client.application.update({
        where: { id: attributed.id },
        data: { status: ApplicationStatus.PAID },
      });
      const unattributed = await ApplicationService.submitApplication(
        {
          jobId: secondJobId,
          candidateName: "Integration Candidate",
          strongestTools: ["TypeScript"],
          aptitudeAnswers,
        },
        { id: candidateId, email: candidateEmail },
      );

      assert.equal(attributed.lockedPayoutCents, 2500);
      assert.ok(attributed.referralId);
      assert.equal(unattributed.referralId, null);

      await client.application.createMany({
        data: [
          {
            id: firstApplicationId,
            jobId: firstJobId,
            candidateEmail: matchedEmail,
            candidateName: "Matched Candidate",
            status: ApplicationStatus.ACTIVE,
            hoursLogged: 10,
            lockedPayoutCents: 2500,
            payoutDeadline: new Date("2099-01-01T00:00:00.000Z"),
          },
          {
            id: secondApplicationId,
            jobId: secondJobId,
            candidateEmail: matchedEmail,
            candidateName: "Matched Candidate",
            status: ApplicationStatus.ACTIVE,
            hoursLogged: 10,
            lockedPayoutCents: 9000,
            payoutDeadline: new Date("2099-01-01T00:00:00.000Z"),
          },
        ],
      });
      const firstReferral = await client.referral.create({
        data: { referrerId, jobId: firstJobId },
      });
      const secondReferral = await client.referral.create({
        data: { referrerId, jobId: secondJobId },
      });
      await client.application.update({
        where: { id: firstApplicationId },
        data: { referralId: firstReferral.id },
      });
      await client.application.update({
        where: { id: secondApplicationId },
        data: { referralId: secondReferral.id },
      });

      const payoutResults = await PayoutEligibilityService.runOnce(
        new Date("2026-09-22T00:00:00.000Z"),
      );
      const relevantResults = payoutResults.filter((result) =>
        [firstApplicationId, secondApplicationId].includes(result.applicationId),
      );
      assert.deepEqual(relevantResults, [
        { applicationId: firstApplicationId, result: "PAYOUT_ELIGIBLE" },
        { applicationId: secondApplicationId, result: "ALREADY_MATCHED" },
      ]);

      const payoutLedger = await client.ledgerEntry.findMany({
        where: { applicationId: { in: [firstApplicationId, secondApplicationId] } },
        orderBy: { amountCents: "desc" },
      });
      assert.deepEqual(
        payoutLedger.map((entry) => entry.amountCents),
        [2500, 0],
      );

      const withdrawalAttempts = await Promise.allSettled([
        WithdrawalService.requestWithdrawal(referrerId, {
          amountCents: 2000,
          payoutMethod: "PAYPAL",
          destinationDetails: `referrer-${suffix}@example.test`,
        }),
        WithdrawalService.requestWithdrawal(referrerId, {
          amountCents: 2000,
          payoutMethod: "PAYPAL",
          destinationDetails: `referrer-${suffix}@example.test`,
        }),
      ]);
      assert.equal(
        withdrawalAttempts.filter((attempt) => attempt.status === "fulfilled")
          .length,
        1,
      );

      const [referrer, fundingLedger] = await Promise.all([
        client.user.findUniqueOrThrow({ where: { id: referrerId } }),
        client.ledgerEntry.aggregate({
          where: { userId: referrerId, account: LedgerAccount.FUNDING },
          _sum: { amountCents: true },
        }),
      ]);
      assert.equal(referrer.fundingBalanceCents, 500);
      assert.equal(
        referrer.fundingBalanceCents,
        fundingLedger._sum.amountCents,
      );
    } finally {
      EmailNotificationService.notifyApplicationSubmitted =
        originalSubmittedNotification;
      await client.ledgerEntry.deleteMany({
        where: { userId: referrerId },
      });
      await client.withdrawal.deleteMany({ where: { userId: referrerId } });
      await client.application.deleteMany({
        where: {
          OR: [
            { candidateEmail },
            { candidateEmail: matchedEmail },
          ],
        },
      });
      await client.referral.deleteMany({ where: { referrerId } });
      await client.candidateIdentity.deleteMany({
        where: { email: { in: [candidateEmail, matchedEmail] } },
      });
      await client.job.deleteMany({
        where: { id: { in: [firstJobId, secondJobId] } },
      });
      await client.user.deleteMany({
        where: { id: { in: [referrerId, candidateId] } },
      });
      await client.$disconnect();
    }
  },
);
