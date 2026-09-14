import type { UserOnboarding } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { PayoutAccountService } from "@/lib/services/payout-account-service";
import type { OnboardingActionInput } from "@/lib/validation/onboarding";

export type OnboardingStatus = {
  ndaSignedAt: string | null;
  dataSubmissionSignedAt: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneVerifiedAt: string | null;
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
    await prisma.userOnboarding.upsert({
      where: { userId },
      create: {
        userId,
        phoneCountryCode: input.phoneCountryCode,
        phoneNumber: input.phoneNumber.trim(),
        phoneVerifiedAt: new Date(),
      },
      update: {
        phoneCountryCode: input.phoneCountryCode,
        phoneNumber: input.phoneNumber.trim(),
        phoneVerifiedAt: new Date(),
      },
    });

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
