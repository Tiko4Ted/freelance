import { Prisma, type UserOnboarding } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { AfricasTalkingSmsService } from "@/lib/services/africas-talking-sms-service";
import { PayoutAccountService } from "@/lib/services/payout-account-service";
import {
  PHONE_VERIFICATION_CODE_TTL_MS,
  PHONE_VERIFICATION_MAX_ATTEMPTS,
  PHONE_VERIFICATION_MAX_SENDS_PER_WINDOW,
  PHONE_VERIFICATION_RESEND_COOLDOWN_MS,
  PHONE_VERIFICATION_SEND_WINDOW_MS,
  PhoneVerificationError,
  generatePhoneVerificationCode,
  getPhoneVerificationSecret,
  hashPhoneVerificationCode,
  normalizePhoneNumber,
  phoneVerificationCodeMatches,
} from "@/lib/services/phone-verification";
import type { OnboardingActionInput } from "@/lib/validation/onboarding";

export type OnboardingStatus = {
  ndaSignedAt: string | null;
  dataSubmissionSignedAt: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneVerifiedAt: string | null;
  phoneVerificationPending: boolean;
  identityLegalName: string | null;
  identityDateOfBirth: string | null;
  identityDocumentType: string | null;
  identityDocumentLast4: string | null;
  identityVerifiedAt: string | null;
  paymentMethod: string | null;
  paymentDestination: string | null;
  paymentSetupAt: string | null;
  payoutAccountReady: boolean;
  completedAt: string | null;
  legalComplete: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  paymentsSetup: boolean;
  complete: boolean;
};

type UserWithOnboarding = {
  payoutAccountReady: boolean;
  onboarding: UserOnboarding | null;
};

export function emptyOnboardingStatus(): OnboardingStatus {
  return serializeStatus({
    payoutAccountReady: false,
    onboarding: null,
  });
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function dateOnlyToDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function serializeStatus(user: UserWithOnboarding): OnboardingStatus {
  const onboarding = user.onboarding;
  const legalComplete = Boolean(
    onboarding?.ndaSignedAt && onboarding.dataSubmissionSignedAt,
  );
  const phoneVerified = Boolean(onboarding?.phoneVerifiedAt);
  const phoneVerificationPending = Boolean(
    !phoneVerified &&
      onboarding?.phoneVerificationCodeHash &&
      onboarding.phoneVerificationExpiresAt &&
      onboarding.phoneVerificationExpiresAt.getTime() > Date.now(),
  );
  const identityVerified = Boolean(onboarding?.identityVerifiedAt);
  const paymentsSetup = Boolean(
    onboarding?.paymentSetupAt && user.payoutAccountReady,
  );
  const complete =
    legalComplete && phoneVerified && identityVerified && paymentsSetup;

  return {
    ndaSignedAt: toIsoDate(onboarding?.ndaSignedAt),
    dataSubmissionSignedAt: toIsoDate(onboarding?.dataSubmissionSignedAt),
    phoneCountryCode: onboarding?.phoneCountryCode ?? null,
    phoneNumber: onboarding?.phoneNumber ?? null,
    phoneVerifiedAt: toIsoDate(onboarding?.phoneVerifiedAt),
    phoneVerificationPending,
    identityLegalName: onboarding?.identityLegalName ?? null,
    identityDateOfBirth: toDateOnly(onboarding?.identityDateOfBirth),
    identityDocumentType: onboarding?.identityDocumentType ?? null,
    identityDocumentLast4: onboarding?.identityDocumentLast4 ?? null,
    identityVerifiedAt: toIsoDate(onboarding?.identityVerifiedAt),
    paymentMethod: onboarding?.paymentMethod ?? null,
    paymentDestination: onboarding?.paymentDestination ?? null,
    paymentSetupAt: toIsoDate(onboarding?.paymentSetupAt),
    payoutAccountReady: user.payoutAccountReady,
    completedAt: toIsoDate(onboarding?.completedAt),
    legalComplete,
    phoneVerified,
    identityVerified,
    paymentsSetup,
    complete,
  };
}

async function runSerializableTransaction<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const canRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2;

      if (!canRetry) {
        throw error;
      }
    }
  }

  throw new Error("PHONE_VERIFICATION_TRANSACTION_FAILED");
}

async function getUserWithOnboarding(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      payoutAccountReady: true,
      onboarding: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

async function getStatusAfterMutation(userId: string): Promise<OnboardingStatus> {
  const status = serializeStatus(await getUserWithOnboarding(userId));

  if (status.complete && !status.completedAt) {
    await prisma.userOnboarding.update({
      where: { userId },
      data: { completedAt: new Date() },
    });

    return serializeStatus(await getUserWithOnboarding(userId));
  }

  return status;
}

export const OnboardingService = {
  async getStatus(userId: string): Promise<OnboardingStatus> {
    return serializeStatus(await getUserWithOnboarding(userId));
  },

  async signLegal(
    userId: string,
    input: Extract<OnboardingActionInput, { action: "signLegal" }>,
  ): Promise<OnboardingStatus> {
    const signedAt = new Date();
    const signature = {
      signerName: input.signerName.trim().replace(/\s+/g, " "),
      signerTitle: input.signerTitle.trim().replace(/\s+/g, " "),
      signatureText: input.signatureText.trim().replace(/\s+/g, " "),
    };
    const data =
      input.document === "nda"
        ? {
            ndaSignedAt: signedAt,
            ndaSignerName: signature.signerName,
            ndaSignerTitle: signature.signerTitle,
            ndaSignatureText: signature.signatureText,
          }
        : {
            dataSubmissionSignedAt: signedAt,
            dataSubmissionSignerName: signature.signerName,
            dataSubmissionSignerTitle: signature.signerTitle,
            dataSubmissionSignatureText: signature.signatureText,
          };

    await prisma.userOnboarding.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return getStatusAfterMutation(userId);
  },

  async verifyPhone(
    userId: string,
    input: Extract<OnboardingActionInput, { action: "verifyPhone" }>,
  ): Promise<OnboardingStatus> {
    const phone = normalizePhoneNumber(
      input.phoneCountryCode,
      input.phoneNumber,
    );
    const secret = getPhoneVerificationSecret();
    const now = new Date();
    const result = await runSerializableTransaction(async (transaction) => {
      const onboarding = await transaction.userOnboarding.findUnique({
        where: { userId },
      });

      if (
        !onboarding?.phoneVerificationCodeHash ||
        !onboarding.phoneVerificationExpiresAt
      ) {
        throw new PhoneVerificationError(
          "PHONE_VERIFICATION_NOT_REQUESTED",
        );
      }

      if (onboarding.phoneVerificationExpiresAt.getTime() <= now.getTime()) {
        await transaction.userOnboarding.update({
          where: { userId },
          data: {
            phoneVerificationCodeHash: null,
            phoneVerificationExpiresAt: null,
            phoneVerificationAttempts: 0,
          },
        });
        return { outcome: "expired" as const };
      }

      const matches = phoneVerificationCodeMatches({
        actualCode: input.verificationCode,
        expectedHash: onboarding.phoneVerificationCodeHash,
        phoneNumber: phone.e164,
        secret,
        userId,
      });

      if (!matches) {
        const attempts = onboarding.phoneVerificationAttempts + 1;
        const exhausted = attempts >= PHONE_VERIFICATION_MAX_ATTEMPTS;
        await transaction.userOnboarding.update({
          where: { userId },
          data: {
            phoneVerificationAttempts: attempts,
            ...(exhausted
              ? {
                  phoneVerificationCodeHash: null,
                  phoneVerificationExpiresAt: null,
                }
              : {}),
          },
        });

        return {
          outcome: exhausted ? ("exhausted" as const) : ("invalid" as const),
          remainingAttempts: Math.max(
            0,
            PHONE_VERIFICATION_MAX_ATTEMPTS - attempts,
          ),
        };
      }

      await transaction.userOnboarding.update({
        where: { userId },
        data: {
          phoneVerifiedAt: now,
          phoneVerificationCodeHash: null,
          phoneVerificationExpiresAt: null,
          phoneVerificationAttempts: 0,
        },
      });

      return { outcome: "verified" as const };
    });

    if (result.outcome === "expired") {
      throw new PhoneVerificationError("PHONE_VERIFICATION_EXPIRED");
    }

    if (result.outcome === "exhausted") {
      throw new PhoneVerificationError(
        "PHONE_VERIFICATION_TOO_MANY_ATTEMPTS",
        { remainingAttempts: 0 },
      );
    }

    if (result.outcome === "invalid") {
      throw new PhoneVerificationError("PHONE_VERIFICATION_INVALID", {
        remainingAttempts: result.remainingAttempts,
      });
    }

    return getStatusAfterMutation(userId);
  },

  async requestPhoneVerification(
    userId: string,
    input: Extract<
      OnboardingActionInput,
      { action: "requestPhoneVerification" }
    >,
  ): Promise<OnboardingStatus> {
    const phone = normalizePhoneNumber(
      input.phoneCountryCode,
      input.phoneNumber,
    );
    const secret = getPhoneVerificationSecret();
    const code = generatePhoneVerificationCode();
    const codeHash = hashPhoneVerificationCode({
      secret,
      userId,
      phoneNumber: phone.e164,
      code,
    });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PHONE_VERIFICATION_CODE_TTL_MS);

    const previous = await runSerializableTransaction(async (transaction) => {
      const onboarding = await transaction.userOnboarding.findUnique({
        where: { userId },
      });

      if (
        onboarding?.phoneVerifiedAt &&
        onboarding.phoneCountryCode === phone.countryCode &&
        onboarding.phoneNumber === phone.nationalNumber
      ) {
        throw new PhoneVerificationError("PHONE_ALREADY_VERIFIED");
      }

      const windowStartedAt =
        onboarding?.phoneVerificationWindowStartedAt &&
        now.getTime() -
          onboarding.phoneVerificationWindowStartedAt.getTime() <
          PHONE_VERIFICATION_SEND_WINDOW_MS
          ? onboarding.phoneVerificationWindowStartedAt
          : now;
      const sendCount =
        windowStartedAt === onboarding?.phoneVerificationWindowStartedAt
          ? onboarding.phoneVerificationSendCount
          : 0;

      if (sendCount >= PHONE_VERIFICATION_MAX_SENDS_PER_WINDOW) {
        throw new PhoneVerificationError(
          "PHONE_VERIFICATION_RATE_LIMITED",
          {
            retryAfterSeconds: Math.max(
              1,
              Math.ceil(
                (windowStartedAt.getTime() +
                  PHONE_VERIFICATION_SEND_WINDOW_MS -
                  now.getTime()) /
                  1_000,
              ),
            ),
          },
        );
      }

      if (onboarding?.phoneVerificationSentAt) {
        const retryAt =
          onboarding.phoneVerificationSentAt.getTime() +
          PHONE_VERIFICATION_RESEND_COOLDOWN_MS;
        if (retryAt > now.getTime()) {
          throw new PhoneVerificationError(
            "PHONE_VERIFICATION_RATE_LIMITED",
            {
              retryAfterSeconds: Math.ceil(
                (retryAt - now.getTime()) / 1_000,
              ),
            },
          );
        }
      }

      const previousState = {
        completedAt: onboarding?.completedAt ?? null,
        phoneCountryCode: onboarding?.phoneCountryCode ?? null,
        phoneNumber: onboarding?.phoneNumber ?? null,
        phoneVerifiedAt: onboarding?.phoneVerifiedAt ?? null,
      };
      const data = {
        phoneCountryCode: phone.countryCode,
        phoneNumber: phone.nationalNumber,
        phoneVerifiedAt: null,
        phoneVerificationCodeHash: codeHash,
        phoneVerificationExpiresAt: expiresAt,
        phoneVerificationAttempts: 0,
        phoneVerificationSentAt: now,
        phoneVerificationSendCount: sendCount + 1,
        phoneVerificationWindowStartedAt: windowStartedAt,
        completedAt: null,
      };

      if (onboarding) {
        await transaction.userOnboarding.update({
          where: { userId },
          data,
        });
      } else {
        await transaction.userOnboarding.create({
          data: { userId, ...data },
        });
      }

      return previousState;
    });

    try {
      await AfricasTalkingSmsService.sendVerificationCode({
        to: phone.e164,
        code,
      });
    } catch (error) {
      await prisma.userOnboarding.updateMany({
        where: { userId, phoneVerificationCodeHash: codeHash },
        data: {
          completedAt: previous.completedAt,
          phoneCountryCode: previous.phoneCountryCode,
          phoneNumber: previous.phoneNumber,
          phoneVerifiedAt: previous.phoneVerifiedAt,
          phoneVerificationCodeHash: null,
          phoneVerificationExpiresAt: null,
          phoneVerificationAttempts: 0,
        },
      });

      if (error instanceof PhoneVerificationError) {
        throw error;
      }

      throw new PhoneVerificationError("PHONE_VERIFICATION_SEND_FAILED");
    }

    return getStatusAfterMutation(userId);
  },

  async verifyIdentity(
    userId: string,
    input: Extract<OnboardingActionInput, { action: "verifyIdentity" }>,
  ): Promise<OnboardingStatus> {
    await prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        identityLegalName: input.legalName.trim().replace(/\s+/g, " "),
        identityDateOfBirth: dateOnlyToDate(input.dateOfBirth),
        identityDocumentType: input.documentType,
        identityDocumentLast4: input.documentLast4.trim().toUpperCase(),
        identityVerifiedAt: new Date(),
      },
      update: {
        identityLegalName: input.legalName.trim().replace(/\s+/g, " "),
        identityDateOfBirth: dateOnlyToDate(input.dateOfBirth),
        identityDocumentType: input.documentType,
        identityDocumentLast4: input.documentLast4.trim().toUpperCase(),
        identityVerifiedAt: new Date(),
      },
    });

    return getStatusAfterMutation(userId);
  },

  async setupPayments(
    userId: string,
    input: Extract<OnboardingActionInput, { action: "setupPayments" }>,
  ): Promise<OnboardingStatus> {
    await PayoutAccountService.startOnboarding(userId);

    await prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        paymentMethod: input.paymentMethod,
        paymentDestination: input.paymentDestination.trim(),
        paymentSetupAt: new Date(),
      },
      update: {
        paymentMethod: input.paymentMethod,
        paymentDestination: input.paymentDestination.trim(),
        paymentSetupAt: new Date(),
      },
    });

    return getStatusAfterMutation(userId);
  },
};
