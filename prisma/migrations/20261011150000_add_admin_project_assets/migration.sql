ALTER TABLE "Job"
  ADD COLUMN "taskBriefFileName" TEXT,
  ADD COLUMN "taskBriefMimeType" TEXT,
  ADD COLUMN "taskBriefContent" BYTEA,
  ADD COLUMN "aptitudeTest" JSONB;
