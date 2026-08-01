import { LedgerAccount, Prisma, WalletTransferType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { WalletTransferInput } from "@/lib/validation/wallet-transfer";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function parseDateOfBirth(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_FREELANCE_ID_DETAILS");
  }

  return date;
}

function sameDate(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function requireIdentityInput(input: WalletTransferInput) {
  if (!input.freelanceIdCode || !input.legalName || !input.dateOfBirth) {
    throw new Error("FREELANCE_ID_REQUIRED");
  }

  return {
    freelanceIdCode: normalizeCode(input.freelanceIdCode),
    legalName: input.legalName.trim(),
    dateOfBirth: parseDateOfBirth(input.dateOfBirth),
  };
}

export const WalletTransferService = {
  async transferHoldingToFunding(userId: string, input: WalletTransferInput) {
    const amountCents = input.amountCents;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          holdingBalanceCents: true,
          fundingBalanceCents: true,
          freelanceVerification: {
            select: {
              id: true,
              freelanceIdCode: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (user.holdingBalanceCents < amountCents) {
        throw new Error("INSUFFICIENT_HOLDING_BALANCE");
      }

      let verificationId = user.freelanceVerification?.id;

      if (!verificationId) {
        const identityInput = requireIdentityInput(input);
        const reference = await tx.freelanceIdentityReference.findUnique({
          where: { freelanceIdCode: identityInput.freelanceIdCode },
          select: {
            freelanceIdCode: true,
            legalName: true,
            dateOfBirth: true,
            isActive: true,
          },
        });

        if (
          !reference?.isActive ||
          normalizeName(reference.legalName) !==
            normalizeName(identityInput.legalName) ||
          !sameDate(reference.dateOfBirth, identityInput.dateOfBirth)
        ) {
          throw new Error("INVALID_FREELANCE_ID_DETAILS");
        }

        const verification = await tx.userFreelanceVerification
          .create({
            data: {
              userId,
              freelanceIdCode: reference.freelanceIdCode,
              legalName: identityInput.legalName,
              dateOfBirth: identityInput.dateOfBirth,
            },
            select: { id: true },
          })
          .catch((error: unknown) => {
            if (isUniqueConstraintError(error)) {
              throw new Error("FREELANCE_ID_ALREADY_USED");
            }

            throw error;
          });

        verificationId = verification.id;
      }

      const debit = await tx.user.updateMany({
        where: {
          id: userId,
          holdingBalanceCents: { gte: amountCents },
        },
        data: {
          holdingBalanceCents: { decrement: amountCents },
          fundingBalanceCents: { increment: amountCents },
        },
      });

      if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_HOLDING_BALANCE");
      }

      const transfer = await tx.walletTransfer.create({
        data: {
          userId,
          amountCents,
          type: WalletTransferType.HOLDING_TO_FUNDING,
          verificationId,
        },
        select: { id: true },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            userId,
            amountCents: -amountCents,
            account: LedgerAccount.HOLDING,
            reason: "HOLDING_TO_FUNDING_TRANSFER",
            transferId: transfer.id,
          },
          {
            userId,
            amountCents,
            account: LedgerAccount.FUNDING,
            reason: "HOLDING_TO_FUNDING_TRANSFER",
            transferId: transfer.id,
          },
        ],
      });

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          holdingBalanceCents: true,
          fundingBalanceCents: true,
          freelanceVerification: {
            select: {
              freelanceIdCode: true,
              verifiedAt: true,
            },
          },
        },
      });

      return {
        holdingBalanceCents: updatedUser.holdingBalanceCents,
        fundingBalanceCents: updatedUser.fundingBalanceCents,
        freelanceVerification: updatedUser.freelanceVerification
          ? {
              freelanceIdCode:
                updatedUser.freelanceVerification.freelanceIdCode,
              verifiedAt:
                updatedUser.freelanceVerification.verifiedAt.toISOString(),
            }
          : null,
      };
    });
  },
};
