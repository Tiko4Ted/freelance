import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

test("builds downloadable and uploadable work samples for featured projects", () => {
  const roles = [
    {
      title: "Image Tagging & Classification Assistant",
      description: "Tag everyday objects in an image packet using a simple labeling guide.",
      expected: /image packet/,
    },
    {
      title: "Audio Transcription & Timestamping Assistant",
      description: "Transcribe short recordings and add timestamps using a clear guide.",
      expected: /audio packet/,
    },
    {
      title: "AI Document Extraction & Quality Evaluator",
      description: "Review AI-extracted document fields against source records and flag exceptions.",
      expected: /ai-document-extraction-01\.jpg/,
    },
  ];

  for (const role of roles) {
    const assignment = buildTaskAssignment({
      id: `application-${role.title}`,
      candidateName: "Ada Candidate",
      job: {
        title: role.title,
        description: role.description,
        companyName: "Trinity-AI",
        payoutType: PayoutTrigger.HOURS_10,
        showOnHome: true,
        skills: [{ label: "Quality control" }],
      },
    });
    const content = assignment.sections
      .flatMap((section) => section.lines)
      .join("\n");

    assert.match(content, role.expected);
    assert.ok(
      assignment.sections.some((section) => section.heading === "Task packet"),
    );
    assert.match(content, /upload/i);
    assert.match(content, /evaluation/i);
  }
});

test("builds image-backed task packets for all four home AI projects", () => {
  const roles = [
    ["AI Search Relevance Evaluator", "ai-search-relevance-01.jpg", /Strong match/],
    ["AI Conversation Quality Evaluator", "ai-conversation-quality-01.jpg", /visual_grounding/],
    ["AI Response Quality Evaluator", "ai-response-quality-01.jpg", /instruction_following/],
    ["AI Document Extraction & Quality Evaluator", "ai-document-extraction-01.jpg", /source_issue/],
  ] as const;

  for (const [title, imageFile, expected] of roles) {
    const assignment = buildTaskAssignment({
      id: `application-${title}`,
      candidateName: "Ada Candidate",
      job: {
        title,
        description: "Evaluate AI outputs against a supplied image source.",
        companyName: "Trinity-AI",
        payoutType: PayoutTrigger.TASK_1,
        showOnHome: true,
        isAiTask: true,
        skills: [{ label: "AI evaluation" }],
      },
    });
    const content = assignment.sections.flatMap((section) => section.lines).join("\n");

    assert.equal(assignment.imageAssets?.length, 1);
    assert.equal(assignment.imageAssets?.[0].fileName, imageFile);
    assert.match(content, expected);
    assert.match(content, new RegExp(imageFile.replace(".", "\\.")));
    assert.match(content, /Do not invent|unsupported|visible/i);
  }
});

test("uses the AI evaluation structure for flagged projects", () => {
  const assignment = buildTaskAssignment({
    id: "application-ai",
    candidateName: "Ada Candidate",
    job: {
      title: "Customer Support Quality Project",
      description: "Review customer support outputs for accuracy and quality.",
      companyName: "Trinity-AI",
      payoutType: PayoutTrigger.TASK_1,
      isAiTask: true,
      skills: [{ label: "Quality control" }],
    },
  });
  const content = assignment.sections
    .flatMap((section) => section.lines)
    .join("\n");

  assert.match(content, /AI data quality and evaluation task/);
  assert.match(content, /model outputs/i);
  assert.match(content, /corrected_output/);
  assert.match(content, /AI-008/);
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

test("embeds compressed task images in the downloadable PDF", () => {
  const image = readFileSync(
    join(process.cwd(), "public", "task-assets", "ai-search-relevance-01.jpg"),
  );
  const pdf = createSimplePdf(
    "Image Task Brief",
    [{ heading: "Task", lines: ["Review the attached image."] }],
    undefined,
    [{
      data: image,
      width: 1024,
      height: 768,
      caption: "Source image for review.",
    }],
  );

  assert.match(pdf.toString("latin1"), /\/Subtype \/Image/);
  assert.match(pdf.toString("latin1"), /\/Filter \/DCTDecode/);
});
