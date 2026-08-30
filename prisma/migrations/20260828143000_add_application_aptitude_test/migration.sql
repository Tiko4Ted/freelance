-- AlterTable
ALTER TABLE "Application"
ADD COLUMN "aptitudeAnswers" JSONB,
ADD COLUMN "aptitudeScorePercent" INTEGER,
ADD COLUMN "aptitudeCorrectAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "aptitudeQuestionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "aptitudePassed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aptitudeSubmittedAt" TIMESTAMP(3);
