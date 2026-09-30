-- AlterTable
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- Backfill users whose referral was already captured when they applied to a job.
UPDATE "User" AS referred
SET "referredById" = referral."referrerId"
FROM "Application" AS application
JOIN "Referral" AS referral ON referral."id" = application."referralId"
WHERE application."applicantUserId" = referred."id"
  AND referred."referredById" IS NULL;

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_referredById_fkey"
FOREIGN KEY ("referredById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
