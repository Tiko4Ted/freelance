-- Store the completed work selected from the Home upload picker.
ALTER TABLE "Application" ADD COLUMN "taskSubmissionFileContent" BYTEA;
ALTER TABLE "Application" ADD COLUMN "taskSubmissionMimeType" TEXT;
