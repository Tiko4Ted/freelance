import assert from "node:assert/strict";
import test from "node:test";

import { ProjectTaskAssignmentStatus } from "@prisma/client";

import { prisma } from "../lib/db/prisma";
import {
  ProjectTaskService,
  PROJECT_TASK_AUTO_REVIEW_DELAY_MS,
} from "../lib/services/project-task-service";

test("approved project tasks credit payment and increment completed tasks once", async () => {
  const originalTransaction = prisma.$transaction;
  const originalFindMany = prisma.projectTaskAssignment.findMany;
  let status = ProjectTaskAssignmentStatus.SUBMITTED;
  let ledgerEntries = 0;
  let holdingBalance = 0;
  let completedTasks = 0;

  const assignment = {
    id: "assignment-1",
    applicationId: "application-1",
    status,
    submittedAt: new Date("2026-10-17T00:00:00.000Z"),
    submissionFileName: "answer.pdf",
    submissionFileContent: Buffer.from("pdf"),
    application: { applicantUserId: "user-1" },
    task: { payoutAmountCents: 2500 },
  };

  const transactionClient = {
    projectTaskAssignment: {
      findUnique: async () => ({ ...assignment, status }),
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: ProjectTaskAssignmentStatus };
        data: { status: ProjectTaskAssignmentStatus };
      }) => {
        if (where.id !== assignment.id || where.status !== status) {
          return { count: 0 };
        }
        status = data.status;
        return { count: 1 };
      },
      findUniqueOrThrow: async () => ({ ...assignment, status }),
    },
    ledgerEntry: {
      create: async () => {
        ledgerEntries += 1;
        return { id: "ledger-1" };
      },
    },
    user: {
      update: async ({
        data,
      }: {
        data: { holdingBalanceCents: { increment: number } };
      }) => {
        holdingBalance += data.holdingBalanceCents.increment;
        return { id: "user-1" };
      },
    },
    application: {
      update: async ({
        data,
      }: {
        data: { tasksCompleted: { increment: number } };
      }) => {
        completedTasks += data.tasksCompleted.increment;
        return { id: "application-1" };
      },
    },
  };

  Object.defineProperty(prisma, "$transaction", {
    configurable: true,
    value: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient),
  });
  Object.defineProperty(prisma.projectTaskAssignment, "findMany", {
    configurable: true,
    value: async () => [{ id: assignment.id }],
  });

  try {
    const first = await ProjectTaskService.autoReviewDueSubmissions(
      new Date(
        assignment.submittedAt.getTime() + PROJECT_TASK_AUTO_REVIEW_DELAY_MS,
      ),
    );

    assert.deepEqual(first, [
      { assignmentId: assignment.id, result: "APPROVED" },
    ]);
    assert.equal(status, ProjectTaskAssignmentStatus.APPROVED);
    assert.equal(ledgerEntries, 1);
    assert.equal(holdingBalance, 2500);
    assert.equal(completedTasks, 1);

    await assert.rejects(
      ProjectTaskService.approve(assignment.id, "admin-1"),
      /TASK_ALREADY_REVIEWED/,
    );
    assert.equal(ledgerEntries, 1);
    assert.equal(holdingBalance, 2500);
    assert.equal(completedTasks, 1);
  } finally {
    Object.defineProperty(prisma, "$transaction", {
      configurable: true,
      value: originalTransaction,
    });
    Object.defineProperty(prisma.projectTaskAssignment, "findMany", {
      configurable: true,
      value: originalFindMany,
    });
  }
});
