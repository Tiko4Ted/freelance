-- CreateTable
CREATE TABLE "UserOnboarding" (
    "userId" TEXT NOT NULL,
    "ndaSignedAt" TIMESTAMP(3),
    "ndaSignerName" TEXT,
    "ndaSignerTitle" TEXT,
    "ndaSignatureText" TEXT,
    "dataSubmissionSignedAt" TIMESTAMP(3),
    "dataSubmissionSignerName" TEXT,
    "dataSubmissionSignerTitle" TEXT,
    "dataSubmissionSignatureText" TEXT,
    "phoneCountryCode" TEXT,
    "phoneNumber" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "identityLegalName" TEXT,
    "identityDateOfBirth" TIMESTAMP(3),
    "identityDocumentType" TEXT,
    "identityDocumentLast4" TEXT,
    "identityVerifiedAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentDestination" TEXT,
    "paymentSetupAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboarding_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
