DROP INDEX "LedgerEntry_applicationId_key";

CREATE INDEX "LedgerEntry_applicationId_idx" ON "LedgerEntry"("applicationId");

CREATE UNIQUE INDEX "LedgerEntry_applicationId_userId_reason_key"
ON "LedgerEntry"("applicationId", "userId", "reason");
