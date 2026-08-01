ALTER TABLE "FreelanceIdentityReference" ADD COLUMN "serialNumber" TEXT;

UPDATE "FreelanceIdentityReference"
SET "serialNumber" = UPPER('SER-' || SUBSTRING(MD5("freelanceIdCode") FROM 1 FOR 8))
WHERE "serialNumber" IS NULL;

ALTER TABLE "FreelanceIdentityReference" ALTER COLUMN "serialNumber" SET NOT NULL;

CREATE UNIQUE INDEX "FreelanceIdentityReference_serialNumber_key" ON "FreelanceIdentityReference"("serialNumber");

ALTER TABLE "UserFreelanceVerification" ADD COLUMN "serialNumber" TEXT;

UPDATE "UserFreelanceVerification" AS verification
SET "serialNumber" = reference."serialNumber"
FROM "FreelanceIdentityReference" AS reference
WHERE verification."freelanceIdCode" = reference."freelanceIdCode"
  AND verification."serialNumber" IS NULL;

ALTER TABLE "UserFreelanceVerification" ALTER COLUMN "serialNumber" SET NOT NULL;

CREATE UNIQUE INDEX "UserFreelanceVerification_serialNumber_key" ON "UserFreelanceVerification"("serialNumber");
