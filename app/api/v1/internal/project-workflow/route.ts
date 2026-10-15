import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { PayoutTrigger, ProjectTaskStatus, Role, Prisma } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const migrationName = "20261015120000_add_project_task_workflow";
const migrationChecksum = "67577b62f360351e90e2ba2410dd3829603a566e9c165960da9cba45bcdf7798";
const migrationStatements = [
  `CREATE TYPE "ProjectTaskStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED')`,
  `CREATE TYPE "ProjectTaskAssignmentStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')`,
  `CREATE TABLE "ProjectTask" ("id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "payoutAmountCents" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD', "status" "ProjectTaskStatus" NOT NULL DEFAULT 'DRAFT', "sequence" INTEGER NOT NULL, "taskBriefFileName" TEXT, "taskBriefMimeType" TEXT, "taskBriefContent" BYTEA, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE "ProjectTaskAssignment" ("id" TEXT NOT NULL, "taskId" TEXT NOT NULL, "applicationId" TEXT NOT NULL, "status" "ProjectTaskAssignmentStatus" NOT NULL DEFAULT 'IN_PROGRESS', "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submittedAt" TIMESTAMP(3), "submissionFileName" TEXT, "submissionFileContent" BYTEA, "submissionMimeType" TEXT, "submissionNotes" TEXT, "reviewedAt" TIMESTAMP(3), "reviewedById" TEXT, "reviewNotes" TEXT, "paymentApprovedAt" TIMESTAMP(3), "paymentAmountCents" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProjectTaskAssignment_pkey" PRIMARY KEY ("id"))`,
  `ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "ProjectTaskAssignment" ADD CONSTRAINT "ProjectTaskAssignment_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "LedgerEntry" ADD COLUMN "taskAssignmentId" TEXT`,
  `ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_taskAssignmentId_fkey" FOREIGN KEY ("taskAssignmentId") REFERENCES "ProjectTaskAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `CREATE UNIQUE INDEX "ProjectTask_projectId_sequence_key" ON "ProjectTask"("projectId", "sequence")`,
  `CREATE INDEX "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status")`,
  `CREATE UNIQUE INDEX "ProjectTaskAssignment_taskId_applicationId_key" ON "ProjectTaskAssignment"("taskId", "applicationId")`,
  `CREATE INDEX "ProjectTaskAssignment_applicationId_status_idx" ON "ProjectTaskAssignment"("applicationId", "status")`,
  `CREATE INDEX "ProjectTaskAssignment_taskId_status_idx" ON "ProjectTaskAssignment"("taskId", "status")`,
  `CREATE UNIQUE INDEX "LedgerEntry_taskAssignmentId_key" ON "LedgerEntry"("taskAssignmentId")`,
];

const oldHomeTitles = [
  "AI Search Relevance Evaluator - Fresh Application Round",
  "AI Response Quality Evaluator - Fresh Application Round",
  "AI Document Extraction & Quality Evaluator - Fresh Application Round",
  "AI Conversation Quality Evaluator - Fresh Application Round",
];
const taskDefinitions = [
  ["AI Search Relevance Evaluator", "ai-search-relevance-evaluator-task-brief-with-response-tables.pdf", "Assess search-result relevance, evidence regions, competing interpretations, and final candidate responses.", 7500],
  ["AI Response Quality Evaluator", "ai-response-quality-evaluator-task-brief-with-response-tables.pdf", "Evaluate response factuality, instruction following, severity, and claim-level evidence.", 8000],
  ["AI Document Extraction and Quality Evaluator", "ai-document-extraction-quality-evaluator-task-brief-with-response-tables.pdf", "Review document extraction against the source image and record precise evidence-backed corrections.", 7000],
  ["AI Conversation Quality Evaluator", "ai-conversation-quality-evaluator-task-brief-with-response-tables.pdf", "Evaluate visual grounding, safety checks, severity, and response quality across conversation cases.", 8500],
  ["AI Safety and Policy Evaluator", "ai-safety-policy-evaluator-task-brief-with-response-tables.pdf", "Judge whether assistant responses follow safety policy, identify risk, and explain the safest correction.", 9000],
  ["AI Code Review Quality Evaluator", "ai-code-review-quality-evaluator-task-brief-with-response-tables.pdf", "Evaluate generated code for correctness, security, maintainability, and instruction fidelity.", 9500],
  ["AI Agent Tool-Use Evaluator", "ai-agent-tool-use-evaluator-task-brief-with-response-tables.pdf", "Check whether an AI agent selected the right tools, used them safely, and reported outcomes accurately.", 9000],
  ["AI Citation Verification Evaluator", "ai-citation-verification-evaluator-task-brief-with-response-tables.pdf", "Verify that cited claims are supported by supplied evidence and flag misleading references.", 7000],
  ["AI Multilingual Localization Evaluator", "ai-multilingual-localization-evaluator-task-brief-with-response-tables.pdf", "Assess meaning, tone, cultural fit, and instruction compliance in localized AI responses.", 8000],
  ["AI Mathematical Reasoning Evaluator", "ai-mathematical-reasoning-evaluator-task-brief-with-response-tables.pdf", "Evaluate mathematical reasoning for correctness, completeness, and clarity.", 8500],
] as const;

function aptitudeTest(title: string): Prisma.InputJsonValue {
  return { passingCorrect: 12, questions: Array.from({ length: 15 }, (_, index) => ({ id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-q-${index + 1}`, prompt: `Which practice best supports high-quality work on ${title}?`, options: [{ id: "a", label: "Follow the supplied evidence, constraints, and review instructions" }, { id: "b", label: "Guess when the evidence is incomplete" }, { id: "c", label: "Skip the rationale when the answer feels obvious" }, { id: "d", label: "Reuse another contributor's response" }], correctOptionId: "a" })) };
}

async function ensureMigration() {
  const rows = await prisma.$queryRawUnsafe<Array<{ migration_name: string }>>(`SELECT "migration_name" FROM "_prisma_migrations" WHERE "migration_name" = '${migrationName}' LIMIT 1`);
  if (rows.length) return;
  await prisma.$transaction(async (tx) => {
    for (const statement of migrationStatements) await tx.$executeRawUnsafe(statement);
    await tx.$executeRawUnsafe(`INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('${crypto.randomUUID()}', '${migrationChecksum}', CURRENT_TIMESTAMP, '${migrationName}', NULL, NULL, CURRENT_TIMESTAMP, 1)`);
  });
}

async function bootstrap() {
  await prisma.$transaction(async (tx) => {
    await tx.job.updateMany({ where: { showOnHome: true, title: { notIn: ["Project Hailmary", "Project Rubric"] } }, data: { isActive: false, showOnHome: false, openings: 0 } });
    await tx.application.updateMany({ where: { job: { title: { in: oldHomeTitles } }, status: { in: ["APPLIED", "CERTIFYING", "CERTIFIED", "MATCHED", "ACTIVE"] } }, data: { status: "CLOSED" } });
    const hailmary = await tx.job.upsert({ where: { title: "Project Hailmary" }, create: { title: "Project Hailmary", description: "A structured AI evaluation workspace with ten independent image-grounded review tasks. Pass one aptitude test, then work through the queue one task at a time.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, currency: "USD", isActive: true, companyName: "Trinity-AI", openings: 2000, participantCount: 2000, isHighDemand: true, showOnHome: true, isAiTask: true, aptitudeTest: aptitudeTest("Project Hailmary") }, update: { description: "A structured AI evaluation workspace with ten independent image-grounded review tasks. Pass one aptitude test, then work through the queue one task at a time.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, isActive: true, openings: 2000, participantCount: 2000, showOnHome: true, isAiTask: true, aptitudeTest: aptitudeTest("Project Hailmary") } });
    await tx.job.upsert({ where: { title: "Project Rubric" }, create: { title: "Project Rubric", description: "A held project container for future rubric-driven AI evaluation tasks. It is ready for task briefs and publication when the operations team is ready.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, currency: "USD", isActive: true, companyName: "Trinity-AI", openings: 2000, participantCount: 2000, showOnHome: false, isAiTask: true, aptitudeTest: aptitudeTest("Project Rubric") }, update: { description: "A held project container for future rubric-driven AI evaluation tasks. It is ready for task briefs and publication when the operations team is ready.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, isActive: true, showOnHome: false, isAiTask: true, aptitudeTest: aptitudeTest("Project Rubric") } });
    for (let index = 0; index < taskDefinitions.length; index += 1) {
      const [title, fileName, description, payoutAmountCents] = taskDefinitions[index];
      const content = fs.readFileSync(path.join(process.cwd(), "public", "task-packets", fileName));
      await tx.projectTask.upsert({ where: { projectId_sequence: { projectId: hailmary.id, sequence: index + 1 } }, create: { projectId: hailmary.id, title, description, payoutAmountCents, currency: "USD", status: ProjectTaskStatus.OPEN, sequence: index + 1, taskBriefFileName: fileName, taskBriefMimeType: "application/pdf", taskBriefContent: content }, update: { title, description, payoutAmountCents, currency: "USD", status: ProjectTaskStatus.OPEN, taskBriefFileName: fileName, taskBriefMimeType: "application/pdf", taskBriefContent: content } });
    }
  }, { maxWait: 30000, timeout: 120000 });
}

export async function POST() {
  try {
    await requireRole(Role.ADMIN);
    await ensureMigration();
    await bootstrap();
    return NextResponse.json({ ok: true, project: "Project Hailmary", taskCount: taskDefinitions.length });
  } catch (error) {
    console.error("Project workflow bootstrap failed", error);
    return NextResponse.json({ error: "Project workflow bootstrap failed" }, { status: 500 });
  }
}
