import assert from "node:assert/strict";
import test from "node:test";

import { PayoutTrigger } from "@prisma/client";

import { createSimplePdf } from "../lib/pdf/simple-pdf";
import { buildTaskAssignment } from "../lib/task-assignment";

test("builds a conversation recording task for audio and language roles", () => {
  const assignment = buildTaskAssignment({
    id: "application-audio",
    candidateName: "Ada Candidate",
    job: {
      title: "Spanish Voice Actor",
      description:
        "Record clear language samples and natural speech for remote audio review.",
      companyName: "Trinity-AI",
      payoutType: PayoutTrigger.TASK_1,
      skills: [
        { label: "Spanish" },
        { label: "Audio recording" },
        { label: "Voice work" },
      ],
    },
  });
  const content = assignment.sections
    .flatMap((section) => section.lines)
    .join("\n");

  assert.match(content, /12 to 18 minute natural conversation/);
  assert.match(content, /friend's email for partner payout review/);
  assert.match(content, /Spanish/);
});

test("builds a role-matched software work sample", () => {
  const assignment = buildTaskAssignment({
    id: "application-software",
    candidateName: "Ada Candidate",
    job: {
      title: "React Developer",
      description:
        "Build, review, test, and improve production software for remote client projects.",
      companyName: "Trinity-AI",
      payoutType: PayoutTrigger.HOURS_10,
      skills: [
        { label: "React" },
        { label: "TypeScript" },
        { label: "Testing" },
      ],
    },
  });
  const content = assignment.sections
    .flatMap((section) => section.lines)
    .join("\n");

  assert.match(content, /Technical work sample/);
  assert.match(content, /React Developer/);
  assert.match(content, /test plan/);
});

test("does not classify science engineering roles as software work", () => {
  const assignment = buildTaskAssignment({
    id: "application-science",
    candidateName: "Ada Candidate",
    job: {
      title: "Mechanical Engineering Subject Matter Expert",
      description:
        "Evaluate specialized engineering tasks for online expert-review projects.",
      companyName: "Trinity-AI",
      payoutType: PayoutTrigger.HOURS_10,
      skills: [
        { label: "Mechanical Engineering" },
        { label: "Technical review" },
        { label: "Scientific reasoning" },
      ],
    },
  });
  const content = assignment.sections
    .flatMap((section) => section.lines)
    .join("\n");

  assert.match(content, /Expert review work sample/);
  assert.doesNotMatch(content, /Technical work sample/);
});

test("renders task assignments as PDF bytes", () => {
  const pdf = createSimplePdf("Task Brief", [
    {
      heading: "Task",
      lines: ["Complete the approved work sample and upload it for review."],
    },
  ]);

  assert.equal(pdf.subarray(0, 8).toString("latin1"), "%PDF-1.4");
  assert.match(pdf.toString("latin1"), /\/Helvetica/);
  assert.match(pdf.toString("latin1"), /startxref/);
});
