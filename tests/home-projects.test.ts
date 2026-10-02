import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "../lib/db/prisma";
import { JobRepository } from "../lib/repositories/job-repository";
import { adminCreateJobSchema } from "../lib/validation/admin";

test("home projects query is flagged, active, available, and limited to three", async () => {
  const originalFindMany = prisma.job.findMany;
  let capturedQuery: Record<string, unknown> | undefined;

  Object.defineProperty(prisma.job, "findMany", {
    configurable: true,
    value: async (query: Record<string, unknown>) => {
      capturedQuery = query;
      return [];
    },
  });

  try {
    await JobRepository.listHomeProjects();
  } finally {
    Object.defineProperty(prisma.job, "findMany", {
      configurable: true,
      value: originalFindMany,
    });
  }

  assert.deepEqual(capturedQuery?.where, {
    isActive: true,
    showOnHome: true,
    openings: { gt: 0 },
    title: { not: "micro1", mode: "insensitive" },
  });
  assert.equal(capturedQuery?.take, 3);
});

test("admin job input accepts home placement and participant capacity", () => {
  const parsed = adminCreateJobSchema.parse({
    title: "AI Quality Review",
    description: "Review AI responses for accuracy, clarity, and policy alignment.",
    payoutAmountCents: 30000,
    openings: 4,
    showOnHome: true,
  });

  assert.equal(parsed.showOnHome, true);
  assert.equal(parsed.openings, 4);
  assert.equal(parsed.isAiTask, true);
});

test("admin job input rejects projects outside the AI task structure", () => {
  assert.throws(
    () =>
      adminCreateJobSchema.parse({
        title: "Legacy Project",
        description: "This project should not use the legacy task structure.",
        payoutAmountCents: 30000,
        isAiTask: false,
      }),
    /Invalid literal value|Invalid input/,
  );
});
