import assert from "node:assert/strict";
import test from "node:test";

import { LedgerAccount, WithdrawalStatus } from "@prisma/client";

import { prisma } from "../lib/db/prisma";
import { WithdrawalService } from "../lib/services/withdrawal-service";

type WithdrawalState = {
  balanceCents: number;
  payoutAccountReady: boolean;
  withdrawals: Array<{
    id: string;
    userId: string;
    amountCents: number;
    status: WithdrawalStatus;
    payoutMethod: string;
    destinationDetails: { label: string };
    providerPayoutId: string | null;
    requestedAt: Date;
    completedAt: Date | null;
    failureReason: string | null;
  }>;
  ledger: Array<{
    userId: string;
    amountCents: number;
    account: LedgerAccount;
    reason: string;
    withdrawalId: string;
  }>;
};

async function withWithdrawalDatabase(
  state: WithdrawalState,
  run: () => Promise<void>,
) {
  const originalTransaction = prisma.$transaction;
  const transactionClient = {
    user: {
      findUnique: async () => ({
        payoutAccountReady: state.payoutAccountReady,
      }),
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          payoutAccountReady: boolean;
          fundingBalanceCents: { gte: number };
        };
        data: { fundingBalanceCents: { decrement: number } };
      }) => {
        if (
          !state.payoutAccountReady ||
          !where.payoutAccountReady ||
          state.balanceCents < where.fundingBalanceCents.gte
        ) {
          return { count: 0 };
        }
        state.balanceCents -= data.fundingBalanceCents.decrement;
        return { count: 1 };
      },
      update: async ({
        data,
      }: {
        data: { fundingBalanceCents: { increment: number } };
      }) => {
        state.balanceCents += data.fundingBalanceCents.increment;
        return {};
      },
    },
    withdrawal: {
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          amountCents: number;
          payoutMethod: string;
          destinationDetails: { label: string };
        };
      }) => {
        const withdrawal = {
          ...data,
          id: `withdrawal-${state.withdrawals.length + 1}`,
          status: WithdrawalStatus.PENDING,
          providerPayoutId: null,
          requestedAt: new Date("2026-09-22T00:00:00.000Z"),
          completedAt: null,
          failureReason: null,
        };
        state.withdrawals.push(withdrawal);
        return withdrawal;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.withdrawals.find((withdrawal) => withdrawal.id === where.id) ??
        null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: WithdrawalStatus };
        data: { status: WithdrawalStatus; failureReason: string };
      }) => {
        const withdrawal = state.withdrawals.find(
          (item) => item.id === where.id && item.status === where.status,
        );
        if (!withdrawal) {
          return { count: 0 };
        }
        withdrawal.status = data.status;
        withdrawal.failureReason = data.failureReason;
        return { count: 1 };
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
          withdrawalId: string;
        };
      }) => {
        state.ledger.push({ ...data });
        return { id: `ledger-${state.ledger.length}` };
      },
    },
  };

  Object.defineProperty(prisma, "$transaction", {
    configurable: true,
    value: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient),
  });

  try {
    await run();
  } finally {
    Object.defineProperty(prisma, "$transaction", {
      configurable: true,
      value: originalTransaction,
    });
  }
}

function initialState(overrides: Partial<WithdrawalState> = {}): WithdrawalState {
  return {
    balanceCents: 1500,
    payoutAccountReady: true,
    withdrawals: [],
    ledger: [],
    ...overrides,
  };
}

test("rapid duplicate withdrawals cannot double-spend the funding balance", async () => {
  const state = initialState();

  await withWithdrawalDatabase(state, async () => {
    const attempts = await Promise.allSettled([
      WithdrawalService.requestWithdrawal("user-1", {
        amountCents: 1000,
        payoutMethod: "PAYPAL",
        destinationDetails: "ada@example.test",
      }),
      WithdrawalService.requestWithdrawal("user-1", {
        amountCents: 1000,
        payoutMethod: "PAYPAL",
        destinationDetails: "ada@example.test",
      }),
    ]);

    assert.equal(
      attempts.filter((attempt) => attempt.status === "fulfilled").length,
      1,
    );
    assert.equal(
      attempts.filter((attempt) => attempt.status === "rejected").length,
      1,
    );
    assert.equal(state.balanceCents, 500);
    assert.equal(state.withdrawals.length, 1);
    assert.deepEqual(
      state.ledger.map((entry) => entry.amountCents),
      [-1000],
    );
  });
});

test("withdrawals require a ready payout account", async () => {
  const state = initialState({ payoutAccountReady: false });

  await withWithdrawalDatabase(state, async () => {
    await assert.rejects(
      WithdrawalService.requestWithdrawal("user-1", {
        amountCents: 1000,
        payoutMethod: "MPESA",
        destinationDetails: "+254700000000",
      }),
      /PAYOUT_ACCOUNT_NOT_READY/,
    );
    assert.equal(state.balanceCents, 1500);
    assert.equal(state.ledger.length, 0);
  });
});

test("failed withdrawal reversal is append-only and idempotent", async () => {
  const state = initialState({
    balanceCents: 500,
    withdrawals: [
      {
        id: "withdrawal-1",
        userId: "user-1",
        amountCents: 1000,
        status: WithdrawalStatus.PROCESSING,
        payoutMethod: "PAYPAL",
        destinationDetails: { label: "ada@example.test" },
        providerPayoutId: null,
        requestedAt: new Date("2026-09-22T00:00:00.000Z"),
        completedAt: null,
        failureReason: null,
      },
    ],
    ledger: [
      {
        userId: "user-1",
        amountCents: -1000,
        account: LedgerAccount.FUNDING,
        reason: "WITHDRAWAL",
        withdrawalId: "withdrawal-1",
      },
    ],
  });

  await withWithdrawalDatabase(state, async () => {
    const first = await WithdrawalService.failWithdrawal(
      "withdrawal-1",
      "Provider payout failed",
    );
    const second = await WithdrawalService.failWithdrawal(
      "withdrawal-1",
      "Provider payout failed",
    );

    assert.equal(first, true);
    assert.equal(second, false);
    assert.equal(state.balanceCents, 1500);
    assert.equal(state.withdrawals[0]?.status, WithdrawalStatus.FAILED);
    assert.deepEqual(
      state.ledger.map((entry) => entry.amountCents),
      [-1000, 1000],
    );
    assert.deepEqual(
      state.ledger.map((entry) => entry.reason),
      ["WITHDRAWAL", "WITHDRAWAL_REVERSAL"],
    );
  });
});
