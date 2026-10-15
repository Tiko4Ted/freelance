-- Parent projects keep their existing Job/Application records. These tables add
-- the independent, repeatable task queue underneath a project.
CREATE TYPE "ProjectTaskStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "ProjectTaskAssignmentStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

CREATE TABLE "ProjectTask" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "payoutAmountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "ProjectTaskStatus" NOT NULL DEFAULT 'DRAFT',
  "sequence" INTEGER NOT NULL,
  "taskBriefFileName" TEXT,
  "taskBriefMimeType" TEXT,
  "taskBriefContent" BYTEA,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectTaskAssignment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "status" "ProjectTaskAssignmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "submissionFileName" TEXT,
  "submissionFileContent" BYTEA,
  "submissionMimeType" TEXT,
  "submissionNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "reviewNotes" TEXT,
  "paymentApprovedAt" TIMESTAMP(3),
  "paymentAmountCents" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectTaskAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry" ADD COLUMN "taskAssignmentId" TEXT;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_taskAssignmentId_fkey" FOREIGN KEY ("taskAssignmentId") REFERENCES "ProjectTaskAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ProjectTask_projectId_sequence_key" ON "ProjectTask"("projectId", "sequence");
CREATE INDEX "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status");
CREATE UNIQUE INDEX "ProjectTaskAssignment_taskId_applicationId_key" ON "ProjectTaskAssignment"("taskId", "applicationId");
CREATE INDEX "ProjectTaskAssignment_applicationId_status_idx" ON "ProjectTaskAssignment"("applicationId", "status");
CREATE INDEX "ProjectTaskAssignment_taskId_status_idx" ON "ProjectTaskAssignment"("taskId", "status");
CREATE UNIQUE INDEX "LedgerEntry_taskAssignmentId_key" ON "LedgerEntry"("taskAssignmentId");
