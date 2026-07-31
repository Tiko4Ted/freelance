-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "expectedHourlyRateUsd" INTEGER,
ADD COLUMN     "startAvailabilityDays" INTEGER,
ADD COLUMN     "strongestTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weeklyAvailabilityHours" INTEGER;
