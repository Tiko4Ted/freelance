ALTER TABLE "UserOnboarding"
ADD COLUMN "phoneVerificationCodeHash" TEXT,
ADD COLUMN "phoneVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "phoneVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "phoneVerificationSentAt" TIMESTAMP(3),
ADD COLUMN "phoneVerificationSendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "phoneVerificationWindowStartedAt" TIMESTAMP(3);
