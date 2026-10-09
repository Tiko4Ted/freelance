-- Extend the existing account roles for annotation work and quality review.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ANNOTATOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'REVIEWER';

CREATE TYPE "AnnotationTaskType" AS ENUM ('SXS_PREFERENCE', 'SINGLE_RESPONSE_CRITIQUE', 'SFT_REWRITE');
CREATE TYPE "AnnotationTaskStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'COMPLETED', 'DISPUTED');
CREATE TYPE "AnnotationAssignmentStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED');
CREATE TYPE "AnnotationReviewGrade" AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_REVISION');

CREATE TABLE "AnnotationProfile" (
    "userId" TEXT NOT NULL,
    "qualifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "averageTimePerTaskSec" INTEGER NOT NULL DEFAULT 0,
    "consensusScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnnotationProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "AnnotationProject" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "taskType" "AnnotationTaskType" NOT NULL,
    "rubricSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnnotationProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnotationTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "AnnotationTaskStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "isGoldStandard" BOOLEAN NOT NULL DEFAULT false,
    "systemInstruction" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "constraints" JSONB,
    "modelOutputs" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnnotationTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnotationAssignment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "status" "AnnotationAssignmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnnotationAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnotationSubmission" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "annotatorId" TEXT NOT NULL,
    "evaluationData" JSONB NOT NULL,
    "timeSpentSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnotationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnnotationReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "grade" "AnnotationReviewGrade" NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "feedbackText" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnotationReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnnotationProject_jobId_key" ON "AnnotationProject"("jobId");
CREATE INDEX "AnnotationTask_projectId_status_idx" ON "AnnotationTask"("projectId", "status");
CREATE INDEX "AnnotationTask_status_createdAt_idx" ON "AnnotationTask"("status", "createdAt");
CREATE UNIQUE INDEX "AnnotationAssignment_taskId_userId_key" ON "AnnotationAssignment"("taskId", "userId");
CREATE INDEX "AnnotationAssignment_userId_status_idx" ON "AnnotationAssignment"("userId", "status");
CREATE INDEX "AnnotationAssignment_status_expiresAt_idx" ON "AnnotationAssignment"("status", "expiresAt");
CREATE INDEX "AnnotationAssignment_applicationId_idx" ON "AnnotationAssignment"("applicationId");
CREATE UNIQUE INDEX "AnnotationSubmission_assignmentId_key" ON "AnnotationSubmission"("assignmentId");
CREATE INDEX "AnnotationSubmission_taskId_idx" ON "AnnotationSubmission"("taskId");
CREATE INDEX "AnnotationSubmission_annotatorId_idx" ON "AnnotationSubmission"("annotatorId");
CREATE UNIQUE INDEX "AnnotationReview_submissionId_reviewerId_key" ON "AnnotationReview"("submissionId", "reviewerId");
CREATE INDEX "AnnotationReview_reviewerId_idx" ON "AnnotationReview"("reviewerId");

ALTER TABLE "AnnotationProfile" ADD CONSTRAINT "AnnotationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationProject" ADD CONSTRAINT "AnnotationProject_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationTask" ADD CONSTRAINT "AnnotationTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AnnotationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationAssignment" ADD CONSTRAINT "AnnotationAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AnnotationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationAssignment" ADD CONSTRAINT "AnnotationAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationAssignment" ADD CONSTRAINT "AnnotationAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnnotationSubmission" ADD CONSTRAINT "AnnotationSubmission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AnnotationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationSubmission" ADD CONSTRAINT "AnnotationSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "AnnotationAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationSubmission" ADD CONSTRAINT "AnnotationSubmission_annotatorId_fkey" FOREIGN KEY ("annotatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationReview" ADD CONSTRAINT "AnnotationReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AnnotationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnotationReview" ADD CONSTRAINT "AnnotationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
