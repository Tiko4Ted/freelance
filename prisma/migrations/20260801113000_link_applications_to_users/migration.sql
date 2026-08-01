ALTER TABLE "Application" ADD COLUMN "applicantUserId" TEXT;

UPDATE "Application" AS application
SET "applicantUserId" = "User"."id"
FROM "User"
WHERE LOWER(application."candidateEmail") = LOWER("User"."email")
  AND application."applicantUserId" IS NULL;

CREATE UNIQUE INDEX "Application_applicantUserId_jobId_key" ON "Application"("applicantUserId", "jobId");

CREATE INDEX "Application_applicantUserId_idx" ON "Application"("applicantUserId");

ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
