import { LedgerAccount, Prisma, WalletTransferType } from "@prisma/client";

import type { RequestContext } from "@/lib/audit/request-context";
import { prisma } from "@/lib/db/prisma";
import { sha256Hex } from "@/lib/security/hash";
import { freelanceIdentityVerificationRateLimiter } from "@/lib/services/freelance-identity-verification-rate-limit";
import type { WalletTransferInput } from "@/lib/validation/wallet-transfer";

const MIN_TRANSFER_CENTS = 1000;

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function dateOnlyToDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function sameDate(left: Date, right: Date): boolean {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function requireIdentityInput(input: WalletTransferInput) {
  if (
    !input.freelanceIdCode ||
    !input.serialNumber ||
    !input.legalName ||
    !input.dateOfBirth
  ) {
    throw new Error("FREELANCE_ID_REQUIRED");
  }

  return {
    freelanceIdCode: normalizeCode(input.freelanceIdCode),
    serialNumber: normalizeCode(input.serialNumber),
    legalName: input.legalName.trim().replace(/\s+/g, " "),
    normalizedLegalName: normalizeName(input.legalName),
    dateOfBirth: dateOnlyToDate(input.dateOfBirth),
  };
}

export const WalletTransferService = {
  async transferHoldingToFunding(
    userId: string,
    input: WalletTransferInput,
    context: RequestContext = { ipAddress: null, userAgent: null },
  ) {
    const amountCents = input.amountCents;

    if (amountCents < MIN_TRANSFER_CENTS) {
      throw new Error("TRANSFER_AMOUNT_BELOW_MINIMUM");
    }

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
              serialNumber: true,
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
        const rateLimit = freelanceIdentityVerificationRateLimiter.check({
          userId,
          ipAddress: context.ipAddress,
          now: new Date(),
        });

        if (rateLimit.locked) {
          throw new Error("IDENTITY_VERIFICATION_LOCKED");
        }

        const reference = await tx.freelanceIdentityReference.findUnique({
          where: { freelanceIdCode: identityInput.freelanceIdCode },
          select: {
            freelanceIdCode: true,
            serialNumber: true,
            legalName: true,
            dateOfBirth: true,
            isActive: true,
          },
        });

        if (
          !reference?.isActive ||
          normalizeCode(reference.serialNumber) !== identityInput.serialNumber ||
          normalizeName(reference.legalName) !== identityInput.normalizedLegalName ||
          !sameDate(reference.dateOfBirth, identityInput.dateOfBirth)
        ) {
          const failure = freelanceIdentityVerificationRateLimiter.recordFailure({
            userId,
            ipAddress: context.ipAddress,
            now: new Date(),
          });
          await prisma.freelanceIdentityVerificationAudit.create({
            data: {
              userId,
              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
              attemptedFreelanceIdHash: sha256Hex(identityInput.freelanceIdCode),
              attemptedSerialHash: sha256Hex(identityInput.serialNumber),
              outcome: "FAILED",
              reason: "INVALID_FREELANCE_ID_DETAILS",
            },
          });

          if (failure.locked) {
            throw new Error("IDENTITY_VERIFICATION_LOCKED");
          }

          throw new Error("INVALID_FREELANCE_ID_DETAILS");
        }

        const verification = await tx.userFreelanceVerification
          .create({
            data: {
              userId,
              freelanceIdCode: reference.freelanceIdCode,
              serialNumber: reference.serialNumber,
              legalName: reference.legalName,
              dateOfBirth: reference.dateOfBirth,
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
