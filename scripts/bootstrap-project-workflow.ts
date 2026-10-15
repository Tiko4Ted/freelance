import fs from "node:fs";
import path from "node:path";

import { PrismaClient, ProjectTaskStatus, PayoutTrigger } from "@prisma/client";

const prisma = new PrismaClient();
const pdfRoot = "C:/Users/ATACAMA/Downloads/ai-task-review-pdfs";

const oldHomeTitles = [
  "AI Search Relevance Evaluator - Fresh Application Round",
  "AI Response Quality Evaluator - Fresh Application Round",
  "AI Document Extraction & Quality Evaluator - Fresh Application Round",
  "AI Conversation Quality Evaluator - Fresh Application Round",
];

function aptitudeTest(title: string) {
  return {
    passingCorrect: 12,
    questions: Array.from({ length: 15 }, (_, index) => ({
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-q-${index + 1}`,
      prompt: `Which practice best supports high-quality work on ${title}?`,
      options: [
        { id: "a", label: "Follow the supplied evidence, constraints, and review instructions" },
        { id: "b", label: "Guess when the evidence is incomplete" },
        { id: "c", label: "Skip the rationale when the answer feels obvious" },
        { id: "d", label: "Reuse another contributor's response" },
      ],
      correctOptionId: "a",
    })),
  };
}

const tasks = [
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

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.job.updateMany({
      where: { showOnHome: true, title: { notIn: ["Project Hailmary", "Project Rubric"] } },
      data: { isActive: false, showOnHome: false, openings: 0 },
    });
    await tx.application.updateMany({
      where: { job: { title: { in: oldHomeTitles } }, status: { in: ["APPLIED", "CERTIFYING", "CERTIFIED", "MATCHED", "ACTIVE"] } },
      data: { status: "CLOSED" },
    });

    const hailmary = await tx.job.upsert({
      where: { title: "Project Hailmary" },
      create: { title: "Project Hailmary", description: "A structured AI evaluation workspace with ten independent image-grounded review tasks. Pass one aptitude test, then work through the queue one task at a time.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, currency: "USD", isActive: true, companyName: "Trinity-AI", openings: 2000, participantCount: 2000, isHighDemand: true, showOnHome: true, isAiTask: true, aptitudeTest: aptitudeTest("Project Hailmary") },
      update: { description: "A structured AI evaluation workspace with ten independent image-grounded review tasks. Pass one aptitude test, then work through the queue one task at a time.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, isActive: true, openings: 2000, participantCount: 2000, showOnHome: true, isAiTask: true, aptitudeTest: aptitudeTest("Project Hailmary") },
    });
    await tx.job.upsert({
      where: { title: "Project Rubric" },
      create: { title: "Project Rubric", description: "A held project container for future rubric-driven AI evaluation tasks. It is ready for task briefs and publication when the operations team is ready.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, currency: "USD", isActive: true, companyName: "Trinity-AI", openings: 2000, participantCount: 2000, showOnHome: false, isAiTask: true, aptitudeTest: aptitudeTest("Project Rubric") },
      update: { description: "A held project container for future rubric-driven AI evaluation tasks. It is ready for task briefs and publication when the operations team is ready.", payoutAmountCents: 7500, payoutType: PayoutTrigger.TASK_1, isActive: true, showOnHome: false, isAiTask: true, aptitudeTest: aptitudeTest("Project Rubric") },
    });
    await tx.jobSkill.deleteMany({ where: { jobId: hailmary.id } });
    await tx.jobSkill.createMany({ data: ["Image-grounded review", "AI quality evaluation", "Evidence-based reasoning", "Structured annotation"].map((label) => ({ jobId: hailmary.id, label })) });

    for (let index = 0; index < tasks.length; index += 1) {
      const [title, filename, description, payoutAmountCents] = tasks[index];
      const content = fs.readFileSync(path.join(pdfRoot, filename));
      await tx.projectTask.upsert({
        where: { projectId_sequence: { projectId: hailmary.id, sequence: index + 1 } },
        create: { projectId: hailmary.id, title, description, payoutAmountCents, currency: "USD", status: ProjectTaskStatus.OPEN, sequence: index + 1, taskBriefFileName: filename, taskBriefMimeType: "application/pdf", taskBriefContent: content },
        update: { title, description, payoutAmountCents, currency: "USD", status: ProjectTaskStatus.OPEN, taskBriefFileName: filename, taskBriefMimeType: "application/pdf", taskBriefContent: content },
      });
    }
  }, { maxWait: 30000, timeout: 120000 });
  console.log(`Bootstrapped Project Hailmary with ${tasks.length} tasks and Project Rubric as a draft container.`);
}

main().finally(() => prisma.$disconnect());
