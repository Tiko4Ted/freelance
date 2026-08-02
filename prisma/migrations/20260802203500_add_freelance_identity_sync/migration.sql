CREATE TABLE "FreelanceIdentitySyncRequest" (
    "idempotencyKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "identityReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreelanceIdentitySyncRequest_pkey" PRIMARY KEY ("idempotencyKey")
);

CREATE TABLE "FreelanceIdentityVerificationAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "attemptedFreelanceIdHash" TEXT,
    "attemptedSerialHash" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreelanceIdentityVerificationAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FreelanceIdentitySyncRequest_identityReferenceId_idx" ON "FreelanceIdentitySyncRequest"("identityReferenceId");

CREATE INDEX "FreelanceIdentityVerificationAudit_userId_idx" ON "FreelanceIdentityVerificationAudit"("userId");

CREATE INDEX "FreelanceIdentityVerificationAudit_ipAddress_idx" ON "FreelanceIdentityVerificationAudit"("ipAddress");

CREATE INDEX "FreelanceIdentityVerificationAudit_outcome_idx" ON "FreelanceIdentityVerificationAudit"("outcome");

CREATE INDEX "FreelanceIdentityVerificationAudit_createdAt_idx" ON "FreelanceIdentityVerificationAudit"("createdAt");

ALTER TABLE "FreelanceIdentitySyncRequest" ADD CONSTRAINT "FreelanceIdentitySyncRequest_identityReferenceId_fkey" FOREIGN KEY ("identityReferenceId") REFERENCES "FreelanceIdentityReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FreelanceIdentityVerificationAudit" ADD CONSTRAINT "FreelanceIdentityVerificationAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
