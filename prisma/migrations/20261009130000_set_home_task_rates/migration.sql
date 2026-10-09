UPDATE "Job"
SET
  "payoutAmountCents" = CASE "title"
    WHEN 'AI Response Quality Evaluator' THEN 5000
    WHEN 'AI Conversation Quality Evaluator' THEN 7500
    WHEN 'AI Search Relevance Evaluator' THEN 10000
    ELSE "payoutAmountCents"
  END,
  "payoutType" = 'TASK_1',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" IN (
  'AI Response Quality Evaluator',
  'AI Conversation Quality Evaluator',
  'AI Search Relevance Evaluator'
);
