import { PrismaClient, PayoutTrigger } from "@prisma/client";

import { createSimplePdf, type PdfSection } from "../lib/pdf/simple-pdf";

type DraftRole = {
  title: string;
  description: string;
  skills: string[];
  focus: string;
  cases: string[];
};

const roles: DraftRole[] = [
  {
    title: "AI Safety & Policy Evaluator",
    description: "Review assistant responses for policy compliance, unsafe assistance, refusal quality, and calibrated escalation across sensitive user scenarios.",
    skills: ["Safety policy", "Risk classification", "Evidence-based review", "Clear writing"],
    focus: "safety policy classification and proportionate escalation",
    cases: ["self-harm support", "dangerous instructions", "privacy exposure", "benign edge cases", "refusal quality"],
  },
  {
    title: "AI Code Review Quality Evaluator",
    description: "Assess AI-generated code for correctness, security, maintainability, test coverage, and whether the implementation satisfies the requested behavior.",
    skills: ["Python", "Code review", "Security checks", "Test reasoning"],
    focus: "code correctness, security, and implementation completeness",
    cases: ["off-by-one defects", "injection risk", "missing validation", "test gaps", "unhandled failures"],
  },
  {
    title: "AI Mathematical Reasoning Evaluator",
    description: "Check model solutions to quantitative problems for valid assumptions, arithmetic accuracy, logical steps, and clear explanations of uncertainty.",
    skills: ["Mathematical reasoning", "Algebra", "Proof checking", "Error analysis"],
    focus: "mathematical validity and step-by-step reasoning quality",
    cases: ["algebraic manipulation", "probability assumptions", "unit conversion", "counterexamples", "rounding errors"],
  },
  {
    title: "AI Multilingual Localization Evaluator",
    description: "Evaluate AI translations and localized replies for meaning preservation, tone, cultural fit, terminology consistency, and harmful ambiguity.",
    skills: ["Localization", "Translation review", "Cultural nuance", "Terminology control"],
    focus: "meaning preservation, locale fit, and terminology consistency",
    cases: ["idioms", "formal versus informal tone", "date and number formats", "product terminology", "ambiguous safety language"],
  },
  {
    title: "AI Healthcare Response Quality Evaluator",
    description: "Review health-related AI responses for factual caution, triage quality, uncertainty handling, non-diagnostic language, and appropriate next steps.",
    skills: ["Health information", "Risk triage", "Factuality", "Safety writing"],
    focus: "safe health information, uncertainty, and appropriate care escalation",
    cases: ["red-flag symptoms", "medication questions", "missing medical history", "false reassurance", "emergency escalation"],
  },
  {
    title: "AI Financial Guidance Evaluator",
    description: "Assess AI financial guidance for factual accuracy, suitability boundaries, transparent assumptions, risk disclosure, and avoidance of overconfident personal advice.",
    skills: ["Financial literacy", "Risk communication", "Numeracy", "Assumption checking"],
    focus: "financial accuracy, suitability boundaries, and risk communication",
    cases: ["budget calculations", "investment uncertainty", "fees", "tax caveats", "personalized advice limits"],
  },
  {
    title: "AI Long-Form Writing & Citation Evaluator",
    description: "Review long AI-written articles for instruction following, structure, source grounding, citation accuracy, unsupported claims, and editorial usefulness.",
    skills: ["Editorial review", "Citation checking", "Research", "Instruction following"],
    focus: "long-form structure, source grounding, and unsupported-claim detection",
    cases: ["source mismatch", "invented citations", "missing counterpoint", "repetition", "brief constraints"],
  },
  {
    title: "AI Agent Tool-Use Evaluator",
    description: "Inspect AI agent traces to determine whether tool calls were necessary, authorized, correctly sequenced, and reflected accurately in the final answer.",
    skills: ["Agent workflows", "Tool tracing", "API reasoning", "Operational safety"],
    focus: "tool selection, action sequencing, authorization, and trace fidelity",
    cases: ["unnecessary calls", "wrong parameters", "stale results", "permission boundaries", "contradictory summaries"],
  },
  {
    title: "AI Visual OCR & Layout Evaluator",
    description: "Evaluate AI extraction from degraded documents and screenshots for field accuracy, reading order, layout interpretation, and explicit uncertainty.",
    skills: ["OCR review", "Document understanding", "Layout analysis", "Data accuracy"],
    focus: "visual text extraction, reading order, and layout-aware accuracy",
    cases: ["blurred characters", "tables", "multi-column order", "handwritten marks", "missing fields"],
  },
  {
    title: "AI Product Recommendation Evaluator",
    description: "Judge AI product recommendations for requirement matching, evidence quality, trade-off clarity, price and availability caveats, and non-deceptive comparisons.",
    skills: ["Comparative research", "Requirement mapping", "Evidence review", "Consumer writing"],
    focus: "requirement matching, transparent trade-offs, and recommendation evidence",
    cases: ["hard constraints", "conflicting preferences", "unsupported rankings", "price caveats", "missing alternatives"],
  },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildAptitudeTest(role: DraftRole) {
  const prompts = [
    `Which skill is most central to ${role.title}?`,
    "What should you do before making a final judgment?",
    "How should an unsupported claim be recorded?",
    "What is the best response to an ambiguous case?",
    "Which evidence should drive the decision?",
    "What belongs in a useful reviewer rationale?",
    "When should a case be escalated?",
    "How should a hard negative be handled?",
    "What should be checked before submission?",
    "How should uncertainty affect the final answer?",
    "What is the correct way to treat client material?",
    "How should conflicting requirements be resolved?",
    "What makes a correction defensible?",
    "How should repeated cases be calibrated?",
    "When is the evaluation ready to submit?",
  ];
  const correctLabels = [
    role.skills[0],
    "Read the brief and confirm the acceptance criteria",
    "Mark it unsupported and cite the missing evidence",
    "Record the uncertainty and apply the escalation rule",
    "The available evidence and the written rubric",
    "A concise explanation tied to observable evidence",
    "When the policy boundary cannot be resolved from the evidence",
    "Compare it against the exact requirement instead of guessing",
    "All required fields, files, and decisions are complete",
    "State what is known, unknown, and what would verify it",
    "Use it only for the assigned project and keep it confidential",
    "Follow the higher-priority written acceptance criterion",
    "Explain the defect, evidence, and change made",
    "Use the same rubric and compare borderline examples",
    "After every required case has a checked, reviewable decision",
  ];

  return {
    passingCorrect: 12,
    questions: prompts.map((prompt, index) => ({
      id: `${slugify(role.title)}-apt-${index + 1}`,
      prompt,
      options: [
        { id: "a", label: correctLabels[index] },
        { id: "b", label: "Choose the fastest answer without checking the brief" },
        { id: "c", label: "Treat an assumption as confirmed evidence" },
        { id: "d", label: "Submit a generic note with no case-level support" },
      ],
      correctOptionId: "a",
    })),
  };
}

function buildBrief(role: DraftRole) {
  const sections: PdfSection[] = [
    {
      heading: "Role objective",
      lines: [
        role.description,
        `Primary evaluation focus: ${role.focus}.`,
        "Use the attached case set as the source of truth. Do not invent facts that are not present in the prompt, trace, source file, or evidence provided.",
      ],
    },
    {
      heading: "Required workflow",
      lines: [
        "1. Read the rubric and complete a calibration pass before making production judgments.",
        `2. Review each case for the relevant signals, including ${role.cases.join(", ")}.`,
        "3. Separate supported evidence, unknown information, and impossible claims. Record the exact reason for every correction.",
        "4. Apply the required label, confidence, severity, and escalation fields consistently.",
        "5. Run a final consistency check across similar cases before uploading.",
      ],
    },
    {
      heading: "Deliverables",
      lines: [
        "A completed structured table with one row per case and no blank required fields.",
        "A concise evidence note for every changed or rejected AI judgment.",
        "An escalation note for each high-risk, ambiguous, or policy-boundary case.",
        "A short batch summary describing the most common model error patterns.",
      ],
    },
    {
      heading: "Decision vocabulary",
      lines: [
        "Supported: the supplied evidence directly establishes the claim or decision.",
        "Unknown: the claim may be possible, but the supplied evidence is insufficient to confirm it.",
        "Impossible from evidence: the requested conclusion cannot be established from the supplied material and needs an external check or user confirmation.",
        "High severity: an error could cause material harm, a dangerous action, a serious privacy issue, or a consequential wrong decision.",
        "Escalate instead of guessing whenever the evidence and rubric do not support a reliable decision.",
      ],
    },
    {
      heading: "Acceptance criteria",
      lines: [
        "Every case has a defensible decision, confidence, evidence note, and rationale.",
        "The response does not add facts, certainty, or sources that the evidence does not support.",
        "Hard negatives and near-duplicate cases are treated consistently.",
        "The uploaded file opens correctly and matches the required column or field structure.",
      ],
    },
  ];

  return createSimplePdf(`${role.title} - Task Brief`, sections, "AI evaluation project brief for approved contributors.");
}

const prisma = new PrismaClient();

async function main() {
  const created: string[] = [];
  const existing: string[] = [];

  for (const role of roles) {
    const alreadyThere = await prisma.job.findUnique({ where: { title: role.title }, select: { id: true } });
    if (alreadyThere) {
      existing.push(role.title);
      continue;
    }

    const slug = slugify(role.title);
    const aptitudeTest = buildAptitudeTest(role);
    const brief = buildBrief(role);

    await prisma.job.create({
      data: {
        title: role.title,
        description: role.description,
        payoutAmountCents: 7500,
        payoutType: PayoutTrigger.TASK_1,
        currency: "USD",
        companyName: "Trinity-AI",
        openings: 30,
        participantCount: 2000,
        isHighDemand: false,
        showOnHome: false,
        isActive: true,
        isAiTask: true,
        aptitudeTest,
        taskBriefFileName: `${slug}-task-brief.pdf`,
        taskBriefMimeType: "application/pdf",
        taskBriefContent: brief,
        skills: { create: role.skills.map((label) => ({ label })) },
      },
    });
    created.push(role.title);
  }

  console.log(JSON.stringify({ created, existing }));
}

main().finally(() => prisma.$disconnect());
