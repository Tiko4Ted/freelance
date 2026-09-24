import assert from "node:assert/strict";
import test from "node:test";

import {
  ApplicationStatus,
  LedgerAccount,
  PayoutTrigger,
} from "@prisma/client";

import { prisma } from "../lib/db/prisma";
import { EmailNotificationService } from "../lib/services/email-notification-service";
import { reconcileLedgerBalances } from "../lib/services/ledger-service";
import { PayoutEligibilityService } from "../lib/services/payout-eligibility-service";

type EligibilityApplication = {
  id: string;
  candidateEmail: string;
  lockedPayoutCents: number | null;
  hoursLogged: number;
  tasksCompleted: number;
  payoutDeadline: Date | null;
  status: ApplicationStatus;
  job: { id: string; payoutType: PayoutTrigger };
  referral: { referrerId: string } | null;
};

type CandidateIdentityState = {
  firstMatchedApplicationId: string | null;
  hasBeenPaidOut: boolean;
};

async function withEligibilityDatabase(
  applications: EligibilityApplication[],
  run: (state: {
    identities: Map<string, CandidateIdentityState>;
    ledger: Array<{
      userId: string;
      amountCents: number;
      account: LedgerAccount;
      reason: string;
      applicationId: string;
    }>;
    balances: Map<string, number>;
    notifications: string[];
    releasedOpenings: string[];
  }) => Promise<void>,
) {
  const originalFindMany = prisma.application.findMany;
  const originalTransaction = prisma.$transaction;
  const originalNotification =
    EmailNotificationService.notifyApplicationStatusChanged;
  const identities = new Map<string, CandidateIdentityState>();
  const ledger: Array<{
    userId: string;
    amountCents: number;
    account: LedgerAccount;
    reason: string;
    applicationId: string;
  }> = [];
  const balances = new Map<string, number>();
  const notifications: string[] = [];
  const releasedOpenings: string[] = [];

  const applicationUpdate = async ({
    where,
    data,
  }: {
    where: { id: string };
    data: { status: ApplicationStatus };
  }) => {
    const application = applications.find((item) => item.id === where.id);
    if (!application) {
      throw new Error("APPLICATION_NOT_FOUND");
    }
    application.status = data.status;
    return application;
  };

  const transactionClient = {
    candidateIdentity: {
      upsert: async ({ where }: { where: { email: string } }) => {
        const existing = identities.get(where.email) ?? {
          firstMatchedApplicationId: null,
          hasBeenPaidOut: false,
        };
        identities.set(where.email, existing);
        return { ...existing };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { email: string; firstMatchedApplicationId: null };
        data: { firstMatchedApplicationId: string };
      }) => {
        const identity = identities.get(where.email);
        if (!identity || identity.firstMatchedApplicationId !== null) {
          return { count: 0 };
        }
        identity.firstMatchedApplicationId = data.firstMatchedApplicationId;
        return { count: 1 };
      },
      findUniqueOrThrow: async ({ where }: { where: { email: string } }) => {
        const identity = identities.get(where.email);
        if (!identity) {
          throw new Error("IDENTITY_NOT_FOUND");
        }
        return { ...identity };
      },
      update: async ({
        where,
        data,
      }: {
        where: { email: string };
        data: { hasBeenPaidOut: boolean };
      }) => {
        const identity = identities.get(where.email);
        if (!identity) {
          throw new Error("IDENTITY_NOT_FOUND");
        }
        identity.hasBeenPaidOut = data.hasBeenPaidOut;
        return identity;
      },
    },
    application: {
      update: applicationUpdate,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: ApplicationStatus };
        data: { status: ApplicationStatus };
      }) => {
        const application = applications.find(
          (item) => item.id === where.id && item.status === where.status,
        );
        if (!application) {
          return { count: 0 };
        }
        application.status = data.status;
        return { count: 1 };
      },
    },
    job: {
      update: async ({ where }: { where: { id: string } }) => {
        releasedOpenings.push(where.id);
        return { id: where.id };
      },
    },
    ledgerEntry: {
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          amountCents: number;
          account: LedgerAccount;
          reason: string;
          applicationId: string;
        };
      }) => {
        if (ledger.some((entry) => entry.applicationId === data.applicationId)) {
          throw new Error("DUPLICATE_LEDGER_ENTRY");
        }
        ledger.push({ ...data });
        return { id: `ledger-${ledger.length}` };
      },
    },
    user: {
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          fundingBalanceCents: { increment: number };
          walletBalanceCents: { increment: number };
        };
      }) => {
        balances.set(
          where.id,
          (balances.get(where.id) ?? 0) + data.fundingBalanceCents.increment,
        );
        assert.equal(
          data.walletBalanceCents.increment,
          data.fundingBalanceCents.increment,
        );
        return { id: where.id };
      },
    },
  };

  Object.defineProperty(prisma.application, "findMany", {
    configurable: true,
    value: async () =>
      applications.filter((item) => item.status === ApplicationStatus.ACTIVE),
  });
  Object.defineProperty(prisma, "$transaction", {
    configurable: true,
    value: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient),
  });
  EmailNotificationService.notifyApplicationStatusChanged = async (
    applicationId,
  ) => {
    notifications.push(applicationId);
  };

  try {
    await run({
      identities,
      ledger,
      balances,
      notifications,
      releasedOpenings,
    });
  } finally {
    Object.defineProperty(prisma.application, "findMany", {
      configurable: true,
      value: originalFindMany,
    });
    Object.defineProperty(prisma, "$transaction", {
      configurable: true,
      value: originalTransaction,
    });
    EmailNotificationService.notifyApplicationStatusChanged =
      originalNotification;
  }
}

function activeApplication(
  id: string,
  overrides: Partial<EligibilityApplication> = {},
): EligibilityApplication {
  return {
    id,
    candidateEmail: "candidate@example.test",
    lockedPayoutCents: 2500,
    hoursLogged: 10,
    tasksCompleted: 0,
    payoutDeadline: new Date("2026-12-31T00:00:00.000Z"),
    status: ApplicationStatus.ACTIVE,
    job: { id: "job-1", payoutType: PayoutTrigger.HOURS_10 },
    referral: { referrerId: "referrer-user" },
    ...overrides,
  };
}

test("only the first eligible match credits a payout and worker reruns are idempotent", async () => {
  const first = activeApplication("application-1");
  const second = activeApplication("application-2");

  await withEligibilityDatabase([first, second], async (state) => {
    const firstRun = await PayoutEligibilityService.runOnce(
      new Date("2026-09-22T00:00:00.000Z"),
    );
    const secondRun = await PayoutEligibilityService.runOnce(
      new Date("2026-09-22T01:00:00.000Z"),
    );

    assert.deepEqual(firstRun, [
      { applicationId: "application-1", result: "PAYOUT_ELIGIBLE" },
      { applicationId: "application-2", result: "ALREADY_MATCHED" },
    ]);
    assert.deepEqual(secondRun, []);
    assert.equal(first.status, ApplicationStatus.PAYOUT_ELIGIBLE);
    assert.equal(second.status, ApplicationStatus.PAID);
    assert.deepEqual(
      state.ledger.map((entry) => entry.amountCents),
      [2500, 0],
    );
    assert.equal(state.balances.get("referrer-user"), 2500);
    assert.deepEqual(state.identities.get("candidate@example.test"), {
      firstMatchedApplicationId: "application-1",
      hasBeenPaidOut: true,
    });
  });
});

test("expired applications produce no ledger entry and notify the candidate", async () => {
  const expired = activeApplication("application-expired", {
    payoutDeadline: new Date("2026-01-01T00:00:00.000Z"),
  });

  await withEligibilityDatabase([expired], async (state) => {
    const result = await PayoutEligibilityService.runOnce(
      new Date("2026-09-22T00:00:00.000Z"),
    );

    assert.deepEqual(result, [
      { applicationId: "application-expired", result: "EXPIRED" },
    ]);
    assert.equal(expired.status, ApplicationStatus.EXPIRED);
    assert.equal(state.ledger.length, 0);
    assert.deepEqual(state.notifications, ["application-expired"]);
    assert.deepEqual(state.releasedOpenings, ["job-1"]);
  });
});

test("wallet reconciliation is derived from append-only ledger entries", () => {
  const balances = reconcileLedgerBalances([
    { account: LedgerAccount.HOLDING, amountCents: 5000 },
    { account: LedgerAccount.HOLDING, amountCents: -1500 },
    { account: LedgerAccount.FUNDING, amountCents: 1500 },
    { account: LedgerAccount.FUNDING, amountCents: -1000 },
    { account: LedgerAccount.LEGACY, amountCents: 999999 },
  ]);

  assert.deepEqual(balances, {
    holdingBalanceCents: 3500,
    fundingBalanceCents: 500,
  });
});
