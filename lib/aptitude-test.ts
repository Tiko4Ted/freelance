import type { PayoutTrigger } from "@prisma/client";

export const APTITUDE_MIN_CORRECT_ANSWERS = 12;

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
  const tertiarySkill = skills[2] ?? fallbackSkills[2];
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
    buildQuestion(
      "instruction-priority",
      "When task instructions and personal preference conflict, what should guide your work?",
      "The written task instructions and acceptance criteria",
      ["The fastest shortcut available", "A different task from another client", "Only the part that seems easiest"],
    ),
    buildQuestion(
      "evidence-quality",
      "Which final note is most useful to a reviewer?",
      "A concise explanation of decisions, evidence, and remaining assumptions",
      ["A note saying the task is done with no detail", "A copied paragraph from an unrelated source", "A private message with no deliverable attached"],
    ),
    buildQuestion(
      "time-management",
      `How should you handle the deadline for this ${taskLabel}?`,
      "Plan the work early enough to review it before submission",
      ["Wait until the deadline passes", "Submit partial work without explanation", "Start only after requesting payment"],
    ),
    buildQuestion(
      "tool-fit",
      `Which skill is most likely to help you complete ${job.title} accurately?`,
      primarySkill,
      ["Package delivery routing", "Restaurant menu planning", "Unrelated account creation"],
    ),
    buildQuestion(
      "communication-update",
      "If you discover a blocker while working, what should you communicate?",
      "The blocker, what you tried, and the specific help or decision needed",
      ["Nothing until the final deadline", "Only a vague message that it is hard", "A request to skip all requirements"],
    ),
    buildQuestion(
      "confidentiality",
      "How should you treat client materials shared for the task?",
      "Use them only for the assigned work and keep them confidential",
      ["Post them publicly for feedback", "Reuse them for unrelated projects", "Share them with anyone who asks"],
    ),
    buildQuestion(
      "revision-response",
      "What is the best response if a reviewer requests a reasonable revision?",
      "Review the feedback, update the deliverable, and explain what changed",
      ["Ignore the feedback", "Delete the original work", "Submit the same file without checking"],
    ),
    buildQuestion(
      "file-readiness",
      "Before uploading a final file, what should be true?",
      "The file opens correctly and contains the requested deliverable",
      ["The file is empty but named correctly", "The file belongs to another job", "The file requires private access the reviewer lacks"],
    ),
    buildQuestion(
      "quality-standard",
      `Which quality standard best fits ${job.title}?`,
      `Clear, accurate work that applies ${tertiarySkill} when relevant`,
      ["Unverified guesses with no notes", "A response unrelated to the job title", "Work completed under someone else's account"],
    ),
    buildQuestion(
      "submission-readiness",
      "When should you submit the application and aptitude test?",
      "After your details are accurate and every aptitude answer is complete",
      ["Before entering required details", "After answering only the first question", "Only after changing the job requirements"],
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
    passed: correctCount >= APTITUDE_MIN_CORRECT_ANSWERS,
  };
}
