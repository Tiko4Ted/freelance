ALTER TABLE "Job"
ADD COLUMN "participantCount" INTEGER NOT NULL DEFAULT 2000;

UPDATE "Job"
SET
  "showOnHome" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "showOnHome" = true
  AND (
    "payoutType" <> 'TASK_1'
    OR "payoutAmountCents" < 5000
    OR "payoutAmountCents" > 10000
  );

UPDATE "Job"
SET "participantCount" = CASE "title"
  WHEN 'AI Response Quality Evaluator' THEN 2000
  WHEN 'AI Conversation Quality Evaluator' THEN 3000
  WHEN 'AI Search Relevance Evaluator' THEN 4000
  ELSE "participantCount"
END
WHERE "title" IN (
  'AI Response Quality Evaluator',
  'AI Conversation Quality Evaluator',
  'AI Search Relevance Evaluator'
);
