import { ApplicationStatus, LedgerAccount, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function formatCurrency(amountCents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function claimEligibleCandidatePayouts(userId: string, email: string) {
  await prisma.$transaction(async (tx) => {
    const eligibleApplications = await tx.application.findMany({
      where: {
        candidateEmail: email,
        status: ApplicationStatus.PAYOUT_ELIGIBLE,
        lockedPayoutCents: { not: null },
        ledgerEntry: { is: null },
      },
      select: {
        id: true,
        lockedPayoutCents: true,
      },
    });

    for (const application of eligibleApplications) {
      if (!application.lockedPayoutCents) {
        continue;
      }

      const ledgerEntry = await tx.ledgerEntry
        .create({
          data: {
            userId,
            amountCents: application.lockedPayoutCents,
            account: LedgerAccount.HOLDING,
            reason: "JOB_PAYOUT_HOLDING",
            applicationId: application.id,
          },
          select: { id: true },
        })
        .catch((error: unknown) => {
          if (isUniqueConstraintError(error)) {
            return null;
          }

          throw error;
        });

      if (!ledgerEntry) {
        continue;
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          holdingBalanceCents: {
            increment: application.lockedPayoutCents,
          },
        },
      });
    }
  });
}

export const LedgerService = {
  async getWallet(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        walletBalanceCents: true,
        holdingBalanceCents: true,
        fundingBalanceCents: true,
        freelanceVerification: {
          select: {
            freelanceIdCode: true,
            legalName: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    await claimEligibleCandidatePayouts(userId, user.email);

    const [updatedUser, ledgerEntries, transfers] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          walletBalanceCents: true,
          holdingBalanceCents: true,
          fundingBalanceCents: true,
          freelanceVerification: {
            select: {
              freelanceIdCode: true,
              legalName: true,
              verifiedAt: true,
            },
          },
        },
      }),
      prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountCents: true,
          account: true,
          reason: true,
          applicationId: true,
          withdrawalId: true,
          transferId: true,
          createdAt: true,
        },
      }),
      prisma.walletTransfer.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountCents: true,
          type: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const reconciledHoldingBalanceCents = ledgerEntries.reduce(
      (total, entry) =>
        entry.account === LedgerAccount.HOLDING
          ? total + entry.amountCents
          : total,
      0,
    );
    const reconciledFundingBalanceCents = ledgerEntries.reduce(
      (total, entry) =>
        entry.account === LedgerAccount.FUNDING
          ? total + entry.amountCents
          : total,
      0,
    );

    return {
      balanceCents: updatedUser.fundingBalanceCents,
      holdingBalanceCents: updatedUser.holdingBalanceCents,
      fundingBalanceCents: updatedUser.fundingBalanceCents,
      legacyBalanceCents: updatedUser.walletBalanceCents,
      reconciledHoldingBalanceCents,
      reconciledFundingBalanceCents,
      formattedBalance: formatCurrency(updatedUser.fundingBalanceCents),
      formattedHoldingBalance: formatCurrency(updatedUser.holdingBalanceCents),
      formattedFundingBalance: formatCurrency(updatedUser.fundingBalanceCents),
      freelanceVerification: updatedUser.freelanceVerification
        ? {
            ...updatedUser.freelanceVerification,
            verifiedAt:
              updatedUser.freelanceVerification.verifiedAt.toISOString(),
          }
        : null,
      ledgerEntries: ledgerEntries.map((entry) => ({
        ...entry,
        formattedAmount: formatCurrency(entry.amountCents),
        createdAt: entry.createdAt.toISOString(),
      })),
      transfers: transfers.map((transfer) => ({
        ...transfer,
        formattedAmount: formatCurrency(transfer.amountCents),
        createdAt: transfer.createdAt.toISOString(),
      })),
    };
  },
};
