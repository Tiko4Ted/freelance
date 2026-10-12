-- CreateEnum
CREATE TYPE "KycReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AddEnumValue
ALTER TYPE "WalletTransferStatus" ADD VALUE 'PENDING' BEFORE 'COMPLETED';

-- AlterTable
ALTER TABLE "UserOnboarding"
ADD COLUMN "kycReviewStatus" "KycReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "kycReviewedAt" TIMESTAMP(3),
ADD COLUMN "kycReviewNote" TEXT;

-- Existing onboarding records that already cleared the review delay keep their
-- established access. New records remain pending until an admin reviews them.
UPDATE "UserOnboarding"
SET "kycReviewStatus" = 'APPROVED',
    "kycReviewedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP)
WHERE "completedAt" IS NOT NULL
  AND "completedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes';

-- CreateIndex
CREATE INDEX "UserOnboarding_kycReviewStatus_createdAt_idx"
ON "UserOnboarding"("kycReviewStatus", "createdAt");
