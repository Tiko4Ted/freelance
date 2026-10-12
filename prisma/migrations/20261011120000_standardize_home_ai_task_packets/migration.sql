UPDATE "Job"
SET
  "showOnHome" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "showOnHome" = true
  AND "title" NOT IN (
    'AI Search Relevance Evaluator',
    'AI Conversation Quality Evaluator',
    'AI Response Quality Evaluator',
    'AI Document Extraction & Quality Evaluator'
  );

UPDATE "Job"
SET
  "showOnHome" = true,
  "isActive" = true,
  "isAiTask" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" IN (
  'AI Search Relevance Evaluator',
  'AI Conversation Quality Evaluator',
  'AI Response Quality Evaluator',
  'AI Document Extraction & Quality Evaluator'
);
