import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { sha256Hex } from "@/lib/security/hash";
import type { FreelanceIdentitySyncInput } from "@/lib/validation/freelance-identity";

export type SyncIdentityResult =
  | { status: "created"; statusCode: 201; id: string }
  | { status: "replayed"; statusCode: 200; id: string | null }
  | { status: "conflict"; statusCode: 409; reason: string };

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function dateOnlyToDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function canonicalPayload(input: FreelanceIdentitySyncInput) {
  return {
    dateOfBirth: input.dateOfBirth,
    freelanceIdCode: normalizeCode(input.freelanceIdCode),
    isActive: input.isActive,
    legalName: input.legalName.trim().replace(/\s+/g, " "),
    normalizedLegalName: normalizeName(input.legalName),
    serialNumber: normalizeCode(input.serialNumber),
  };
}

function payloadHash(input: FreelanceIdentitySyncInput): string {
  return sha256Hex(JSON.stringify(canonicalPayload(input)));
}

export const FreelanceIdentitySyncService = {
  async syncIdentity(input: FreelanceIdentitySyncInput): Promise<SyncIdentityResult> {
    const hash = payloadHash(input);
    const payload = canonicalPayload(input);
    const dateOfBirth = dateOnlyToDate(payload.dateOfBirth);

    return prisma.$transaction(async (tx) => {
      const existingRequest = await tx.freelanceIdentitySyncRequest.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: {
          payloadHash: true,
          identityReferenceId: true,
        },
      });

      if (existingRequest) {
        if (existingRequest.payloadHash !== hash) {
          return {
            status: "conflict",
            statusCode: 409,
            reason: "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH",
          };
        }

        return {
          status: "replayed",
          statusCode: 200,
          id: existingRequest.identityReferenceId,
        };
      }

      const references = await tx.freelanceIdentityReference.findMany({
        where: {
          OR: [
            { freelanceIdCode: payload.freelanceIdCode },
            { serialNumber: payload.serialNumber },
            { dateOfBirth },
          ],
        },
        select: {
          id: true,
          freelanceIdCode: true,
          serialNumber: true,
          legalName: true,
          dateOfBirth: true,
        },
      });

      const conflictingReference = references.find((reference) => {
        return (
          reference.freelanceIdCode === payload.freelanceIdCode ||
          reference.serialNumber === payload.serialNumber ||
          (sameDate(reference.dateOfBirth, dateOfBirth) &&
            normalizeName(reference.legalName) === payload.normalizedLegalName)
        );
      });

      if (conflictingReference) {
        return {
          status: "conflict",
          statusCode: 409,
          reason: "IDENTITY_FIELD_CONFLICT",
        };
      }

      try {
        const reference = await tx.freelanceIdentityReference.create({
          data: {
            freelanceIdCode: payload.freelanceIdCode,
            serialNumber: payload.serialNumber,
            legalName: payload.legalName,
            dateOfBirth,
            isActive: payload.isActive,
          },
          select: { id: true },
        });

        await tx.freelanceIdentitySyncRequest.create({
          data: {
            idempotencyKey: input.idempotencyKey,
            payloadHash: hash,
            payload: payload as unknown as Prisma.InputJsonValue,
            identityReferenceId: reference.id,
          },
        });

        return {
          status: "created",
          statusCode: 201,
          id: reference.id,
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return {
            status: "conflict",
            statusCode: 409,
            reason: "IDENTITY_FIELD_CONFLICT",
          };
        }

        throw error;
      }
    });
  },
};

function sameDate(left: Date, right: Date): boolean {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
