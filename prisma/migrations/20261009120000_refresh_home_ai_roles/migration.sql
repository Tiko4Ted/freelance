UPDATE "Job"
SET
  "showOnHome" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "title" IN (
  'Image Tagging & Classification Assistant',
  'Audio Transcription & Timestamping Assistant',
  'AI Document Extraction & Quality Evaluator'
);

INSERT INTO "Job" (
  "id",
  "title",
  "description",
  "payoutAmountCents",
  "payoutType",
  "currency",
  "isActive",
  "companyName",
  "openings",
  "hourlyMinCents",
  "hourlyMaxCents",
  "postedAt",
  "isHighDemand",
  "showOnHome",
  "isAiTask",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    md5('trinity-ai-home-ai-response-quality-evaluator'),
    'AI Response Quality Evaluator',
    'Review AI-generated answers against clear rubrics for accuracy, helpfulness, instruction-following, and safety, then record concise evidence-based feedback.',
    15000,
    'TASK_1',
    'USD',
    true,
    'Trinity-AI',
    40,
    1500,
    1800,
    CURRENT_TIMESTAMP,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    md5('trinity-ai-home-ai-conversation-quality-evaluator'),
    'AI Conversation Quality Evaluator',
    'Review short user and AI conversations, identify where the model loses context or produces an unsafe or unhelpful reply, and record structured quality judgments.',
    15000,
    'TASK_1',
    'USD',
    true,
    'Trinity-AI',
    35,
    1500,
    1800,
    CURRENT_TIMESTAMP,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    md5('trinity-ai-home-ai-search-relevance-evaluator'),
    'AI Search Relevance Evaluator',
    'Compare AI search results and summaries with user intent, rank relevance and usefulness, flag unsupported claims, and explain each decision using project guidelines.',
    15000,
    'TASK_1',
    'USD',
    true,
    'Trinity-AI',
    30,
    1500,
    1800,
    CURRENT_TIMESTAMP,
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("title") DO UPDATE SET
  "description" = EXCLUDED."description",
  "payoutAmountCents" = EXCLUDED."payoutAmountCents",
  "payoutType" = EXCLUDED."payoutType",
  "currency" = EXCLUDED."currency",
  "isActive" = EXCLUDED."isActive",
  "companyName" = EXCLUDED."companyName",
  "openings" = EXCLUDED."openings",
  "hourlyMinCents" = EXCLUDED."hourlyMinCents",
  "hourlyMaxCents" = EXCLUDED."hourlyMaxCents",
  "postedAt" = EXCLUDED."postedAt",
  "isHighDemand" = EXCLUDED."isHighDemand",
  "showOnHome" = EXCLUDED."showOnHome",
  "isAiTask" = EXCLUDED."isAiTask",
  "updatedAt" = CURRENT_TIMESTAMP;

DELETE FROM "JobSkill"
WHERE "jobId" IN (
  SELECT "id"
  FROM "Job"
  WHERE "title" IN (
    'AI Response Quality Evaluator',
    'AI Conversation Quality Evaluator',
    'AI Search Relevance Evaluator'
  )
);

INSERT INTO "JobSkill" ("id", "jobId", "label")
SELECT
  md5("Job"."id" || ':' || skills."label"),
  "Job"."id",
  skills."label"
FROM "Job"
JOIN (
  VALUES
    ('AI Response Quality Evaluator', 'AI output review'),
    ('AI Response Quality Evaluator', 'Quality evaluation'),
    ('AI Response Quality Evaluator', 'Instruction following'),
    ('AI Response Quality Evaluator', 'Written judgment'),
    ('AI Response Quality Evaluator', 'Safety review'),
    ('AI Response Quality Evaluator', 'Evidence-based feedback'),
    ('AI Conversation Quality Evaluator', 'Conversation review'),
    ('AI Conversation Quality Evaluator', 'AI behavior evaluation'),
    ('AI Conversation Quality Evaluator', 'Context checking'),
    ('AI Conversation Quality Evaluator', 'Safety review'),
    ('AI Conversation Quality Evaluator', 'Following instructions'),
    ('AI Conversation Quality Evaluator', 'Clear written feedback'),
    ('AI Search Relevance Evaluator', 'Search relevance'),
    ('AI Search Relevance Evaluator', 'AI result evaluation'),
    ('AI Search Relevance Evaluator', 'User intent'),
    ('AI Search Relevance Evaluator', 'Content judgment'),
    ('AI Search Relevance Evaluator', 'Quality checking'),
    ('AI Search Relevance Evaluator', 'Written rationale')
) AS skills("title", "label")
  ON skills."title" = "Job"."title";
