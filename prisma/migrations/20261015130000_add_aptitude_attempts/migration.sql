-- Persist the selected aptitude version and retry state independently from
-- the candidate's single application row.
CREATE TYPE "AptitudeAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

CREATE TABLE "AptitudeAttempt" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "applicantUserId" TEXT,
    "applicationId" TEXT,
    "candidateEmail" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "testVersionId" TEXT NOT NULL,
    "status" "AptitudeAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "answers" JSONB,
    "correctAnswers" INTEGER,
    "questionCount" INTEGER,
    "scorePercent" INTEGER,
    "passed" BOOLEAN,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "retryAvailableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AptitudeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AptitudeAttempt_jobId_candidateEmail_attemptNumber_key"
ON "AptitudeAttempt"("jobId", "candidateEmail", "attemptNumber");
CREATE INDEX "AptitudeAttempt_jobId_candidateEmail_status_idx"
ON "AptitudeAttempt"("jobId", "candidateEmail", "status");
CREATE INDEX "AptitudeAttempt_applicantUserId_jobId_createdAt_idx"
ON "AptitudeAttempt"("applicantUserId", "jobId", "createdAt");
CREATE INDEX "AptitudeAttempt_retryAvailableAt_status_idx"
ON "AptitudeAttempt"("retryAvailableAt", "status");

ALTER TABLE "AptitudeAttempt"
ADD CONSTRAINT "AptitudeAttempt_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AptitudeAttempt"
ADD CONSTRAINT "AptitudeAttempt_applicantUserId_fkey"
FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AptitudeAttempt"
ADD CONSTRAINT "AptitudeAttempt_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
