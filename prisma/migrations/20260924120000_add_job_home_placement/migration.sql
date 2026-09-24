-- AlterTable
ALTER TABLE "Job" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Job_showOnHome_isActive_postedAt_idx"
ON "Job"("showOnHome", "isActive", "postedAt");
