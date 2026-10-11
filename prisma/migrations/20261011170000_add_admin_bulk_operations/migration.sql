-- CreateEnum
CREATE TYPE "AdminBulkOperationStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "AdminBulkOperation" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "sourceStatus" "ApplicationStatus",
    "targetStatus" "ApplicationStatus" NOT NULL,
    "jobId" TEXT,
    "olderThanHours" INTEGER,
    "maxItems" INTEGER NOT NULL DEFAULT 100,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "AdminBulkOperationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "changedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminBulkOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminBulkOperation_status_scheduledAt_idx" ON "AdminBulkOperation"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "AdminBulkOperation_createdAt_idx" ON "AdminBulkOperation"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminBulkOperation" ADD CONSTRAINT "AdminBulkOperation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminBulkOperation" ADD CONSTRAINT "AdminBulkOperation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
