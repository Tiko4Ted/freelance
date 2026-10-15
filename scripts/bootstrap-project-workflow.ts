import fs from "node:fs";
import path from "node:path";

import { PrismaClient, ProjectTaskStatus, PayoutTrigger } from "@prisma/client";

const prisma = new PrismaClient();
const pdfRoot = path.join(process.cwd(), "public", "task-packets");

const oldHomeTitles = [
  "AI Search Relevance Evaluator - Fresh Application Round",
  "AI Response Quality Evaluator - Fresh Application Round",
  "AI Document Extraction & Quality Evaluator - Fresh Application Round",
  "AI Conversation Quality Evaluator - Fresh Application Round",
];

function aptitudeTest(title: string) {
  const questionBank = [
    ["For search relevance, what should determine the corrected judgement?", "Whether the result satisfies the user's stated intent", ["Whether the result has the longest text", "Whether the result looks visually polished", "Whether the result is the first item shown"]],
    ["When reviewing a model response, what is the strongest factuality check?", "Compare each material claim with the supplied evidence", ["Reward confident wording without checking", "Assume common knowledge is always enough", "Judge only the response length"]],
    ["What is the safest way to review an extracted document field?", "Compare the field with the corresponding source region", ["Fill missing characters from memory", "Accept every OCR value automatically", "Ignore the source image if the format looks right"]],
    ["What does visual grounding require in a conversation evaluation?", "Claims must be supported by what is visible in the image", ["The answer must mention every object", "The response must use technical vocabulary", "The reviewer must infer hidden context"]],
    ["When should a safety case be escalated?", "When the policy boundary cannot be resolved from the supplied evidence", ["Whenever the response is short", "Only when the user requests escalation", "Never if the assistant sounds polite"]],
    ["What is the first concern in an AI code review?", "Whether the implementation satisfies the requested behavior safely", ["Whether the code uses the newest framework", "Whether variable names are unusually long", "Whether the response contains many comments"]],
    ["How should an agent tool call be evaluated?", "Check that it was necessary, authorized, correctly sequenced, and reflected accurately", ["Assume every tool call is valid", "Judge only the final prose", "Reward the greatest number of tool calls"]],
    ["What makes a citation verification judgement defensible?", "The cited source directly supports the specific claim", ["The source has a familiar domain name", "The claim sounds plausible", "The citation appears at the end of a paragraph"]],
    ["What is the key test for multilingual localization quality?", "Meaning, tone, and required terminology are preserved for the target audience", ["Translate every word literally", "Prefer longer sentences", "Remove culturally specific context"]],
    ["What should a mathematical reasoning review examine?", "Assumptions, logical steps, arithmetic, and the final conclusion", ["Only whether the final number looks familiar", "Only the formatting of equations", "Whether the explanation uses advanced symbols"]],
    ["What belongs in an evidence region field?", "A stable grid label such as 2B or a clearly listed group of cells", ["A vague phrase such as near the middle", "The filename only", "The reviewer's personal location"]],
    ["How should confidence be selected?", "Use High for clear evidence, Medium for reasonable ambiguity, and Low when evidence is insufficient", ["Always choose High to be decisive", "Choose based on the payout amount", "Choose randomly to avoid bias"]],
    ["What makes a useful competing interpretation?", "The strongest plausible alternative reading of the same evidence", ["A completely unrelated scenario", "A repeat of the original judgement", "A guess about the author's intent"]],
    ["What should a rationale explain?", "Why the selected judgement is better supported than the competing interpretation", ["Why the reviewer prefers the writing style", "Why the case was assigned", "Why the task should pay more"]],
    ["What is required before submitting an evaluation packet?", "Every required row is complete, evidence is traceable, and no unsupported facts were added", ["Only the first section is filled", "The response is copied from another worker", "The file is submitted without checking"]],
  ] as const;

  return {
    passingCorrect: 12,
    questions: questionBank.map(([prompt, correct, distractors], index) => ({
      id: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-q-${index + 1}`,
      prompt,
      options: [
        { id: "a", label: correct },
        { id: "b", label: distractors[0] },
        { id: "c", label: distractors[1] },
        { id: "d", label: distractors[2] },
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
