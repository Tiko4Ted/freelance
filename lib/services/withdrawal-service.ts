import { LedgerAccount, WithdrawalStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getPayoutProvider } from "@/lib/payments";
import type { WithdrawalRequestInput } from "@/lib/validation/withdrawal";

const MIN_WITHDRAWAL_CENTS = 1000;

function toWithdrawalResponse(withdrawal: {
  id: string;
  amountCents: number;
  status: WithdrawalStatus;
  payoutMethod: string | null;
  destinationDetails: unknown;
  providerPayoutId: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
}) {
  return {
    ...withdrawal,
    requestedAt: withdrawal.requestedAt.toISOString(),
    completedAt: withdrawal.completedAt?.toISOString() ?? null,
  };
}

export const WithdrawalService = {
  async listWithdrawals(userId: string) {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        amountCents: true,
        status: true,
        payoutMethod: true,
        destinationDetails: true,
        providerPayoutId: true,
        requestedAt: true,
        completedAt: true,
        failureReason: true,
      },
    });

    return withdrawals.map(toWithdrawalResponse);
  },

  async requestWithdrawal(userId: string, input: WithdrawalRequestInput) {
    if (input.amountCents < MIN_WITHDRAWAL_CENTS) {
      throw new Error("WITHDRAWAL_BELOW_MINIMUM");
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: {
          id: userId,
          fundingBalanceCents: { gte: input.amountCents },
        },
        data: {
          fundingBalanceCents: {
            decrement: input.amountCents,
          },
        },
      });

      if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_FUNDING_BALANCE");
      }

      const createdWithdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amountCents: input.amountCents,
          payoutMethod: input.payoutMethod,
          destinationDetails: {
            label: input.destinationDetails,
          },
        },
        select: {
          id: true,
          amountCents: true,
          status: true,
          payoutMethod: true,
          destinationDetails: true,
          providerPayoutId: true,
          requestedAt: true,
          completedAt: true,
          failureReason: true,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId,
          amountCents: -input.amountCents,
          account: LedgerAccount.FUNDING,
          reason: "WITHDRAWAL",
          withdrawalId: createdWithdrawal.id,
        },
      });

      return createdWithdrawal;
    });

    return toWithdrawalResponse(withdrawal);
  },

  async processPending() {
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: { status: WithdrawalStatus.PENDING },
      select: {
        id: true,
        userId: true,
        amountCents: true,
        payoutMethod: true,
        destinationDetails: true,
        user: {
          select: {
            payoutProvider: true,
            payoutAccountId: true,
          },
        },
      },
    });

    const results = [];

    for (const withdrawal of pendingWithdrawals) {
      const claimed = await prisma.withdrawal.updateMany({
        where: { id: withdrawal.id, status: WithdrawalStatus.PENDING },
        data: { status: WithdrawalStatus.PROCESSING },
      });

      if (claimed.count !== 1) {
        continue;
      }

      const destination =
        withdrawal.destinationDetails &&
        typeof withdrawal.destinationDetails === "object" &&
        "label" in withdrawal.destinationDetails &&
        typeof withdrawal.destinationDetails.label === "string"
          ? withdrawal.destinationDetails.label
          : null;

      if (!withdrawal.payoutMethod || !destination) {
        await this.failWithdrawal(withdrawal.id, "Missing payout destination");
        results.push({ withdrawalId: withdrawal.id, result: "FAILED" });
        continue;
      }

      const provider = getPayoutProvider(withdrawal.user.payoutProvider);
      const payout = await provider.sendPayout({
        providerAccountId: `${withdrawal.payoutMethod}:${destination}`,
        amount: withdrawal.amountCents,
        currency: "USD",
        idempotencyKey: withdrawal.id,
      });

      if (payout.status === "failed") {
        await this.failWithdrawal(withdrawal.id, "Provider payout failed");
        results.push({ withdrawalId: withdrawal.id, result: "FAILED" });
        continue;
      }

      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status:
            payout.status === "paid"
              ? WithdrawalStatus.PAID
              : WithdrawalStatus.PROCESSING,
          providerPayoutId: payout.providerPayoutId,
          completedAt: payout.status === "paid" ? new Date() : null,
        },
      });

      results.push({ withdrawalId: withdrawal.id, result: payout.status });
    }

    return results;
  },

  async failWithdrawal(id: string, failureReason: string) {
    await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.update({
        where: { id },
        data: {
          status: WithdrawalStatus.FAILED,
          failureReason,
        },
        select: {
          id: true,
          userId: true,
          amountCents: true,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: withdrawal.userId,
          amountCents: withdrawal.amountCents,
          account: LedgerAccount.FUNDING,
          reason: "WITHDRAWAL_REVERSAL",
          withdrawalId: withdrawal.id,
        },
      });

      await tx.user.update({
        where: { id: withdrawal.userId },
        data: {
          fundingBalanceCents: {
            increment: withdrawal.amountCents,
          },
        },
      });
    });
  },
};
