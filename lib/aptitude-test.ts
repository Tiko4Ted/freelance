import type { PayoutTrigger } from "@prisma/client";

export const APTITUDE_PASS_PERCENT = 40;

export type AptitudeJob = {
  title: string;
  description: string;
  payoutType: PayoutTrigger | string;
  skills: { label: string }[];
};

export type AptitudeOption = {
  id: string;
  label: string;
};

type AptitudeQuestionWithAnswer = {
  id: string;
  prompt: string;
  options: AptitudeOption[];
  correctOptionId: string;
};

export type AptitudeQuestion = Omit<
  AptitudeQuestionWithAnswer,
  "correctOptionId"
>;

export type AptitudeAnswer = {
  questionId: string;
  selectedOptionId: string;
};

const fallbackSkills = [
  "Quality assurance",
  "Research",
  "Technical writing",
  "Data review",
];

const categoryOptions = {
  software: {
    label: "Technical implementation and testing",
    distractors: ["Untargeted marketing copy", "Payroll administration"],
  },
  audio: {
    label: "Clear recordings that follow the task instructions",
    distractors: ["Spreadsheet cleanup only", "Backend database tuning"],
  },
  science: {
    label: "Evidence-backed technical review",
    distractors: ["Social media scheduling", "Logo color selection"],
  },
  legal: {
    label: "Careful clause review and compliance judgment",
    distractors: ["Photo retouching", "Game level design"],
  },
  data: {
    label: "Accurate labeling, checking, and structured notes",
    distractors: ["Live event hosting", "Mechanical equipment repair"],
  },
  sales: {
    label: "CRM updates, prospect research, and clear handoff notes",
    distractors: ["Medical lab testing", "Raw audio capture only"],
  },
  general: {
    label: "Careful task completion with concise notes",
    distractors: ["Ignoring project guidelines", "Submitting unrelated files"],
  },
};

function uniqueLabels(labels: string[]) {
  return [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
}

function skillLabels(job: AptitudeJob) {
  const labels = uniqueLabels(job.skills.map((skill) => skill.label));
  return labels.length ? labels : fallbackSkills;
}

function searchableText(job: AptitudeJob) {
  return `${job.title} ${job.description} ${skillLabels(job).join(" ")}`.toLowerCase();
}

function inferCategory(job: AptitudeJob): keyof typeof categoryOptions {
  const searchable = searchableText(job);

  if (
    [
      "software",
      "developer",
      "typescript",
      "react",
      "python",
      "code",
      "github",
    ].some((term) => searchable.includes(term))
  ) {
    return "software";
  }

  if (
    ["audio", "voice", "recording", "speech", "language", "video"].some(
      (term) => searchable.includes(term),
    )
  ) {
    return "audio";
  }

  if (
    [
      "science",
      "biology",
      "chemistry",
      "engineering",
      "physics",
      "materials",
      "medical",
      "healthcare",
    ].some((term) => searchable.includes(term))
  ) {
    return "science";
  }

  if (
    ["legal", "contract", "compliance", "privacy", "ediscovery"].some(
      (term) => searchable.includes(term),
    )
  ) {
    return "legal";
  }

  if (
    ["data", "annotation", "label", "spreadsheet", "analytics"].some((term) =>
      searchable.includes(term),
    )
  ) {
    return "data";
  }

  if (
    ["sales", "crm", "revenue", "prospect", "customer"].some((term) =>
      searchable.includes(term),
    )
  ) {
    return "sales";
  }

  return "general";
}

function buildQuestion(
  id: string,
  prompt: string,
  correctLabel: string,
  distractors: [string, string, string],
): AptitudeQuestionWithAnswer {
  const options = [
    { id: "a", label: correctLabel },
    { id: "b", label: distractors[0] },
    { id: "c", label: distractors[1] },
    { id: "d", label: distractors[2] },
  ];
  const rotation = id.charCodeAt(0) % options.length;

  return {
    id,
    prompt,
    options: [...options.slice(rotation), ...options.slice(0, rotation)],
    correctOptionId: "a",
  };
}

function getQuestionKey(job: AptitudeJob) {
  const skills = skillLabels(job);
  const primarySkill = skills[0] ?? fallbackSkills[0];
  const secondarySkill = skills[1] ?? fallbackSkills[1];
  const category = categoryOptions[inferCategory(job)];
  const taskLabel =
    job.payoutType === "TASK_1"
      ? "one-task assignment"
      : "hourly task assignment";

  return [
    buildQuestion(
      "role-focus",
      `Which area is most directly related to the ${job.title} task?`,
      primarySkill,
      ["Unrelated personal errands", "Payroll tax filing", "Office furniture setup"],
    ),
    buildQuestion(
      "work-start",
      `What should you do first before starting this ${taskLabel}?`,
      "Read the project instructions and confirm the expected deliverable",
      ["Start without checking the brief", "Submit a blank file", "Ask for payout before doing the work"],
    ),
    buildQuestion(
      "quality-response",
      "If a task instruction is unclear, what is the best response?",
      "Flag the uncertainty and explain the assumption you used",
      ["Guess silently and hide uncertainty", "Skip the task completely", "Copy an unrelated answer"],
    ),
    buildQuestion(
      "domain-output",
      `Which output best matches ${job.title} work?`,
      category.label,
      [category.distractors[0], category.distractors[1], "A file with no notes or evidence"],
    ),
    buildQuestion(
      "completion-check",
      `Before submitting work for ${job.title}, what should you check?`,
      `That the deliverable is complete, accurate, and uses ${secondarySkill} where relevant`,
      ["That the fastest possible answer was submitted", "That another candidate did the work", "That required files are missing"],
    ),
  ];
}

export function buildAptitudeTest(job: AptitudeJob): AptitudeQuestion[] {
  return getQuestionKey(job).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }));
}

export function scoreAptitudeTest(job: AptitudeJob, answers: AptitudeAnswer[]) {
  const questions = getQuestionKey(job);
  const answerMap = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionId]),
  );
  const correctCount = questions.filter(
    (question) => answerMap.get(question.id) === question.correctOptionId,
  ).length;
  const totalQuestions = questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  return {
    correctCount,
    totalQuestions,
    scorePercent,
    passed: scorePercent > APTITUDE_PASS_PERCENT,
  };
}
