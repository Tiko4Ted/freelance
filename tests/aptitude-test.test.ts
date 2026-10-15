import assert from "node:assert/strict";
import test from "node:test";

import { PayoutTrigger } from "@prisma/client";

import {
  aptitudeTestBankSchema,
  buildAptitudeTest,
  getAptitudeTestVersions,
  scoreAptitudeTest,
  type AptitudeAnswer,
  type AptitudeJob,
} from "../lib/aptitude-test";
import {
  buildHailmaryAptitudeBank,
  validateAptitudeTestBank,
} from "../lib/aptitude-test-bank";

const questionIds = [
  "role-focus",
  "work-start",
  "quality-response",
  "domain-output",
  "completion-check",
  "instruction-priority",
  "evidence-quality",
  "time-management",
  "tool-fit",
  "communication-update",
  "confidentiality",
  "revision-response",
  "file-readiness",
  "quality-standard",
  "submission-readiness",
];

const softwareJob: AptitudeJob = {
  title: "React Developer",
  description:
    "Build, review, test, and improve production software for remote client projects.",
  payoutType: PayoutTrigger.TASK_1,
  skills: [
    { label: "React" },
    { label: "TypeScript" },
    { label: "Testing" },
  ],
};

test("builds a simple aptitude test related to the selected task", () => {
  const questions = buildAptitudeTest(softwareJob);
  const content = questions
    .flatMap((question) => [
      question.prompt,
      ...question.options.map((option) => option.label),
    ])
    .join("\n");

  assert.equal(questions.length, 15);
  assert.match(content, /React Developer/);
  assert.match(content, /React/);
  assert.match(content, /Technical implementation and testing/);
});

test("passes applicants who answer at least 12 of 15 questions correctly", () => {
  const answers: AptitudeAnswer[] = questionIds.map((questionId, index) => ({
    questionId,
    selectedOptionId: index < 12 ? "a" : "b",
  }));
  const result = scoreAptitudeTest(softwareJob, answers);

  assert.equal(result.correctCount, 12);
  assert.equal(result.scorePercent, 80);
  assert.equal(result.passed, true);
});

test("does not auto-approve applicants who answer fewer than 12 correctly", () => {
  const answers: AptitudeAnswer[] = questionIds.map((questionId, index) => ({
    questionId,
    selectedOptionId: index < 11 ? "a" : "b",
  }));
  const result = scoreAptitudeTest(softwareJob, answers);

  assert.equal(result.correctCount, 11);
  assert.equal(result.scorePercent, 73);
  assert.equal(result.passed, false);
});

test("builds 20 aptitude versions with globally unique IDs and prompts", () => {
  const bank = buildHailmaryAptitudeBank();
  const summary = validateAptitudeTestBank(bank);

  assert.equal(summary.versionCount, 20);
  assert.equal(summary.questionCount, 300);
  assert.equal(summary.promptCount, 300);
  assert.equal(bank.passingCorrect, 12);
  assert.deepEqual(
    bank.versions.map((version) => version.questions.length),
    Array.from({ length: 20 }, () => 15),
  );
});

test("Hailmary upgrades a legacy single-test record to the version bank", () => {
  const versions = getAptitudeTestVersions({
    title: "Project Hailmary",
    description: "legacy record",
    payoutType: PayoutTrigger.TASK_1,
    skills: [],
    aptitudeTest: {
      passingCorrect: 12,
      questions: [],
    },
  });

  assert.equal(versions.length, 20);
  assert.equal(new Set(versions.map((version) => version.id)).size, 20);
});

test("each aptitude version scores with the same 12-of-15 limit", () => {
  const bank = buildHailmaryAptitudeBank();
  const job: AptitudeJob = {
    title: "Project Hailmary",
    description: "Evidence-grounded AI quality review",
    payoutType: PayoutTrigger.TASK_1,
    skills: [{ label: "Image-grounded review" }],
    aptitudeTest: bank,
  };

  for (const version of bank.versions) {
    const answers = version.questions.map((question, index) => ({
      questionId: question.id,
      selectedOptionId: index < 12 ? "a" : "b",
    }));
    const result = scoreAptitudeTest(job, answers, version.id);
    assert.equal(result.totalQuestions, 15);
    assert.equal(result.correctCount, 12);
    assert.equal(result.passed, true);
  }
});

test("the bank schema rejects duplicate prompts before they can be published", () => {
  const bank = buildHailmaryAptitudeBank();
  bank.versions[1].questions[0].prompt = bank.versions[0].questions[0].prompt;

  assert.equal(aptitudeTestBankSchema.safeParse(bank).success, false);
});
