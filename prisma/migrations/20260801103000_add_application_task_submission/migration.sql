-- AlterTable
ALTER TABLE "Application" ADD COLUMN "taskSubmissionFileName" TEXT;
ALTER TABLE "Application" ADD COLUMN "taskSubmissionNotes" TEXT;
ALTER TABLE "Application" ADD COLUMN "taskSubmittedAt" TIMESTAMP(3);
