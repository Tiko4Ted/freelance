import assert from "node:assert/strict";
import test from "node:test";

import { PayoutTrigger } from "@prisma/client";

import {
  buildAptitudeTest,
  scoreAptitudeTest,
  type AptitudeAnswer,
  type AptitudeJob,
} from "../lib/aptitude-test";

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
