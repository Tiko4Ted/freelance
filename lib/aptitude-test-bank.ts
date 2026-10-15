type BankQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

export type AptitudeTestBank = {
  passingCorrect: number;
  versions: { id: string; questions: BankQuestion[] }[];
};

const variants = [
  ["evidence triage", "a product photo with a visible price tag", "the visible price and currency", "a caption that is not visible", "region-first notes"],
  ["search relevance", "a query for a waterproof trail jacket", "the query intent and product attributes", "a similar item from memory", "attribute matching"],
  ["document extraction", "a scanned invoice with a partially hidden total", "only characters that can be read", "a guessed digit based on the subtotal", "field-level confidence"],
  ["visual grounding", "a street scene with several parked vehicles", "the requested vehicle and its stable location", "the most prominent object in the frame", "grid coordinates"],
  ["safety review", "a health answer that suggests changing medication", "the risk and the need for qualified care", "a confident diagnosis from one symptom", "careful escalation"],
  ["code evaluation", "a patch that changes authentication middleware", "tests, security impact, and the changed path", "only whether the code compiles", "risk-based review"],
  ["tool-use review", "an agent trace with an external search call", "the tool input, returned evidence, and final claim", "the tool name alone", "trace verification"],
  ["citation checking", "a response with three linked sources", "whether each source supports the nearby claim", "whether the links look reputable", "claim-to-source mapping"],
  ["localization", "a translated warning for a regional audience", "meaning, tone, and locale-specific conventions", "word-for-word similarity only", "meaning preservation"],
  ["reasoning review", "a calculation with a correct result but missing units", "the result, method, and units", "the final number without context", "step verification"],
  ["image evidence", "a low-quality CCTV frame with a numbered grid", "the smallest stable region that supports the claim", "the whole image by default", "precise region labeling"],
  ["confidence scoring", "an ambiguous image where two readings are plausible", "confidence proportional to available evidence", "high confidence because an answer is required", "calibrated uncertainty"],
  ["competing interpretation", "a sign that can be read in two ways", "the strongest alternative and why it loses", "ignoring the alternative", "explicit comparison"],
  ["annotation rationale", "a label that needs a short reviewer explanation", "a concise evidence-based reason", "a long unrelated narrative", "reproducible rationale"],
  ["submission readiness", "a completed table with one empty required field", "resolve every required field before upload", "submit and explain the omission later", "final completeness check"],
  ["instruction hierarchy", "a brief with both required and optional fields", "complete required fields and follow the stated format", "replace requirements with personal preference", "constraint tracking"],
  ["quality control", "two reviewers disagree on a claim", "compare evidence and document the decision", "choose the faster reviewer", "disagreement resolution"],
  ["privacy handling", "an image containing a private identifier", "use it only for the assigned review and protect it", "copy it into a public example", "data minimization"],
  ["edge-case handling", "a frame is too blurred to support a requested detail", "mark it unknown or escalate instead of guessing", "infer the detail from context", "honest abstention"],
  ["final audit", "a batch of annotations ready for delivery", "check consistency, required fields, and evidence links", "rename files without reviewing content", "delivery audit"],
] as const;

const correctOptions = [
  "Record only what the provided evidence supports, and explain uncertainty.",
  "Apply the project rubric consistently and preserve the requested output format.",
  "Use the smallest reliable evidence unit needed for a reviewer to reproduce the decision.",
  "Escalate or mark unknown when the evidence cannot justify a confident conclusion.",
  "Separate observed facts from interpretation and state the reasoning clearly.",
] as const;

function makeQuestion(
  version: number,
  index: number,
  variant: (typeof variants)[number],
): BankQuestion {
  const [focus, scenario, signal, distractorContext, method] = variant;
  const correct = correctOptions[(version + index) % correctOptions.length];
  const prompts = [
    `Version ${String(version).padStart(2, "0")} — For ${focus}, what should be identified first in ${scenario}: ${signal}?`,
    `Version ${String(version).padStart(2, "0")} — Which evidence standard applies when reviewing ${scenario}?`,
    `Version ${String(version).padStart(2, "0")} — What is the safest response if ${distractorContext} cannot be verified in ${scenario}?`,
    `Version ${String(version).padStart(2, "0")} — Which practice best supports ${method} for this case?`,
    `Version ${String(version).padStart(2, "0")} — Before finalizing a ${focus} judgement, what should the reviewer compare?`,
  ];
  const prompt = `${prompts[index % prompts.length]} Checkpoint ${index + 1} of 15.`;
  const options = [
    { id: "a", label: correct },
    { id: "b", label: `Assume ${distractorContext} is true because it sounds plausible.` },
    { id: "c", label: "Use a generic label without recording the relevant evidence." },
    { id: "d", label: "Copy a nearby example even when its context is different." },
  ];

  return {
    id: `hailmary-v${String(version).padStart(2, "0")}-q${String(index + 1).padStart(2, "0")}`,
    prompt,
    options,
    correctOptionId: "a",
  };
}

export function buildHailmaryAptitudeBank(): AptitudeTestBank {
  return {
    passingCorrect: 12,
    versions: variants.map((variant, versionIndex) => ({
      id: `hailmary-v${String(versionIndex + 1).padStart(2, "0")}`,
      questions: Array.from({ length: 15 }, (_, questionIndex) =>
        makeQuestion(versionIndex + 1, questionIndex, variant),
      ),
    })),
  };
}

export function validateAptitudeTestBank(bank: AptitudeTestBank) {
  const versions = new Set(bank.versions.map((version) => version.id));
  const questionIds = new Set<string>();
  const prompts = new Set<string>();

  if (versions.size !== bank.versions.length) {
    throw new Error("Aptitude version IDs must be unique");
  }

  for (const version of bank.versions) {
    if (version.questions.length !== 15) {
      throw new Error(`${version.id} must contain exactly 15 questions`);
    }

    for (const question of version.questions) {
      if (questionIds.has(question.id)) {
        throw new Error(`Duplicate aptitude question ID: ${question.id}`);
      }
      if (prompts.has(question.prompt)) {
        throw new Error(`Duplicate aptitude prompt: ${question.prompt}`);
      }
      questionIds.add(question.id);
      prompts.add(question.prompt);
    }
  }

  return {
    versionCount: bank.versions.length,
    questionCount: questionIds.size,
    promptCount: prompts.size,
  };
}
