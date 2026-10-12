import { KycReviewStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isOnboardingReviewApproved } from "@/lib/onboarding-review";
import { EmailNotificationService } from "@/lib/services/email-notification-service";

function toReviewResponse(review: {
  userId: string;
  kycReviewStatus: KycReviewStatus;
  kycReviewedAt: Date | null;
  kycReviewNote: string | null;
  identityLegalName: string | null;
  identityDateOfBirth: Date | null;
  identityDocumentType: string | null;
  identityVerifiedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  user: { name: string; email: string; role: Role };
}) {
  return {
    userId: review.userId,
    name: review.user.name,
    email: review.user.email,
    kycReviewStatus: review.kycReviewStatus,
    kycReviewedAt: review.kycReviewedAt?.toISOString() ?? null,
    kycReviewNote: review.kycReviewNote,
    identityLegalName: review.identityLegalName,
    identityDateOfBirth: review.identityDateOfBirth?.toISOString().slice(0, 10) ?? null,
    identityDocumentType: review.identityDocumentType,
    identityVerifiedAt: review.identityVerifiedAt?.toISOString() ?? null,
    completedAt: review.completedAt?.toISOString() ?? null,
    createdAt: review.createdAt.toISOString(),
  };
}

const reviewSelect = {
  userId: true,
  kycReviewStatus: true,
  kycReviewedAt: true,
  kycReviewNote: true,
  identityLegalName: true,
  identityDateOfBirth: true,
  identityDocumentType: true,
  identityVerifiedAt: true,
  completedAt: true,
  createdAt: true,
  user: { select: { name: true, email: true, role: true } },
};

export const AdminKycService = {
  async listReviews() {
    const reviews = await prisma.userOnboarding.findMany({
      where: {
        identityVerifiedAt: { not: null },
        user: { role: { not: Role.ADMIN } },
      },
      orderBy: [
        { kycReviewStatus: "asc" },
        { createdAt: "desc" },
      ],
      take: 100,
      select: reviewSelect,
    });

    return reviews.map(toReviewResponse);
  },

  async updateReview(
    userId: string,
    status: KycReviewStatus,
    note?: string | null,
  ) {
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId },
      select: { identityVerifiedAt: true },
    });

    if (!onboarding) {
      throw new Error("KYC_RECORD_NOT_FOUND");
    }

    if (!onboarding.identityVerifiedAt) {
      throw new Error("KYC_IDENTITY_NOT_VERIFIED");
    }

    const review = await prisma.userOnboarding.update({
      where: { userId },
      data: {
        kycReviewStatus: status,
        kycReviewedAt: new Date(),
        kycReviewNote: note?.trim() || null,
      },
      select: reviewSelect,
    });

    if (
      status === KycReviewStatus.APPROVED &&
      review.completedAt &&
      isOnboardingReviewApproved(review.completedAt)
    ) {
      try {
        await EmailNotificationService.sendOnboardingApprovedEmail(
          { name: review.user.name, to: review.user.email },
          `kyc-approved:${review.userId}:${review.kycReviewedAt?.toISOString() ?? "now"}`,
        );
      } catch (error) {
        console.error("KYC approval email failed", {
          error,
          userId: review.userId,
        });
      }
    }

    return toReviewResponse(review);
  },
};
