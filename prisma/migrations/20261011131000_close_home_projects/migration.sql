UPDATE "Application" AS application
SET
  "status" = 'CLOSED',
  "updatedAt" = CURRENT_TIMESTAMP
FROM "Job" AS job
WHERE application."jobId" = job."id"
  AND job."showOnHome" = true
  AND application."taskSubmittedAt" IS NULL
  AND application."status" IN ('APPLIED', 'CERTIFIED', 'MATCHED', 'ACTIVE', 'CERTIFYING');

UPDATE "Job"
SET
  "showOnHome" = false,
  "isActive" = false,
  "openings" = 0,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "showOnHome" = true;
