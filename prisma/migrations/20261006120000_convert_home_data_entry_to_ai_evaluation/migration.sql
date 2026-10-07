DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Job"
    WHERE "title" = 'Document Data Entry & Quality Check Assistant'
  ) AND NOT EXISTS (
    SELECT 1
    FROM "Job"
    WHERE "title" = 'AI Document Extraction & Quality Evaluator'
  ) THEN
    UPDATE "Job"
    SET
      "title" = 'AI Document Extraction & Quality Evaluator',
      "description" = 'Review AI-extracted fields from a document packet against the source records, correct errors and omissions using a fixed schema, then upload the completed evaluation file. No specialist background required; careful comparison and clear exception notes are the focus.',
      "payoutType" = 'TASK_1',
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "title" = 'Document Data Entry & Quality Check Assistant';
  END IF;
END $$;

DELETE FROM "JobSkill"
WHERE "jobId" IN (
  SELECT "id"
  FROM "Job"
  WHERE "title" = 'AI Document Extraction & Quality Evaluator'
);

INSERT INTO "JobSkill" ("id", "jobId", "label")
SELECT md5(random()::text || clock_timestamp()::text || skills."label"), "Job"."id", skills."label"
FROM "Job"
CROSS JOIN (
  VALUES
    ('AI output review'),
    ('Data annotation'),
    ('Document comparison'),
    ('Structured data'),
    ('Quality checking'),
    ('Following instructions'),
    ('File-based deliverables')
) AS skills("label")
WHERE "Job"."title" = 'AI Document Extraction & Quality Evaluator';
