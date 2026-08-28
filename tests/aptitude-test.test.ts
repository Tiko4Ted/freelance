import assert from "node:assert/strict";
import test from "node:test";

import { PayoutTrigger } from "@prisma/client";

import {
  buildAptitudeTest,
  scoreAptitudeTest,
  type AptitudeAnswer,
  type AptitudeJob,
} from "../lib/aptitude-test";

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

  assert.equal(questions.length, 5);
  assert.match(content, /React Developer/);
  assert.match(content, /React/);
  assert.match(content, /Technical implementation and testing/);
});

test("passes applicants who score above 40 percent", () => {
  const answers: AptitudeAnswer[] = [
    { questionId: "role-focus", selectedOptionId: "a" },
    { questionId: "work-start", selectedOptionId: "a" },
    { questionId: "quality-response", selectedOptionId: "a" },
    { questionId: "domain-output", selectedOptionId: "b" },
    { questionId: "completion-check", selectedOptionId: "b" },
  ];
  const result = scoreAptitudeTest(softwareJob, answers);

  assert.equal(result.correctCount, 3);
  assert.equal(result.scorePercent, 60);
  assert.equal(result.passed, true);
});

test("does not auto-approve applicants who score exactly 40 percent", () => {
  const answers: AptitudeAnswer[] = [
    { questionId: "role-focus", selectedOptionId: "a" },
    { questionId: "work-start", selectedOptionId: "a" },
    { questionId: "quality-response", selectedOptionId: "b" },
    { questionId: "domain-output", selectedOptionId: "b" },
    { questionId: "completion-check", selectedOptionId: "b" },
  ];
  const result = scoreAptitudeTest(softwareJob, answers);

  assert.equal(result.correctCount, 2);
  assert.equal(result.scorePercent, 40);
  assert.equal(result.passed, false);
});
