import {
  LedgerAccount,
  Prisma,
  ProjectTaskAssignmentStatus,
  ProjectTaskStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isOnboardingReviewApproved } from "@/lib/onboarding-review";
import { EmailNotificationService } from "@/lib/services/email-notification-service";
import type { TaskSubmissionInput } from "@/lib/validation/task-submission";

export const PROJECT_TASK_AUTO_REVIEW_DELAY_MS = 2 * 60 * 60 * 1000;
export const PROJECT_TASK_AUTO_REVIEW_BATCH_SIZE = 100;

const eligibleApplicationStatuses = [
  "CERTIFIED",
  "MATCHED",
  "ACTIVE",
  "PAYOUT_ELIGIBLE",
  "PAID",
] as const;

function isUnique(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function taskView(task: {
  id: string;
  projectId: string;
  title: string;
  description: string;
  payoutAmountCents: number;
  currency: string;
  status: ProjectTaskStatus;
  sequence: number;
  taskBriefFileName: string | null;
  taskBriefContent: Buffer | null;
  assignments?: Array<{
    id: string;
    applicationId: string;
    status: ProjectTaskAssignmentStatus;
    submittedAt: Date | null;
    submissionFileName: string | null;
  }>;
  _count?: { assignments: number };
}) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    payoutAmountCents: task.payoutAmountCents,
    currency: task.currency,
    status: task.status,
    sequence: task.sequence,
    taskBriefFileName: task.taskBriefFileName,
    hasBrief: Boolean(task.taskBriefContent?.length),
    assignmentCount: task._count?.assignments ?? task.assignments?.length ?? 0,
    assignments: task.assignments?.map((assignment) => ({
      id: assignment.id,
      applicationId: assignment.applicationId,
      status: assignment.status,
      submittedAt: assignment.submittedAt?.toISOString() ?? null,
      submissionFileName: assignment.submissionFileName,
    })),
  };
}

async function notifyTaskSubmission(assignmentId: string) {
  const assignment = await prisma.projectTaskAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      application: { select: { candidateEmail: true, candidateName: true } },
      task: { select: { title: true, project: { select: { title: true } } } },
    },
  });

  if (assignment) {
    await EmailNotificationService.notifyProjectTaskSubmitted({
      to: assignment.application.candidateEmail,
      name: assignment.application.candidateName,
      taskTitle: assignment.task.title,
      projectTitle: assignment.task.project.title,
    });
  }
}

export const ProjectTaskService = {
  async listForProject(projectId: string) {
    const tasks = await prisma.projectTask.findMany({
      where: { projectId },
      orderBy: { sequence: "asc" },
      include: { _count: { select: { assignments: true } } },
    });
    return tasks.map(taskView);
  },

  async listForApplication(applicationId: string) {
    const tasks = await prisma.projectTask.findMany({
      where: { projectId: (await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, select: { jobId: true } })).jobId },
      orderBy: { sequence: "asc" },
      include: {
        assignments: {
          where: { applicationId },
          select: { id: true, applicationId: true, status: true, submittedAt: true, submissionFileName: true },
        },
      },
    });
    return tasks.map(taskView);
  },

  async createTask(input: {
    projectId: string;
    title: string;
    description: string;
    payoutAmountCents: number;
    sequence: number;
    status: ProjectTaskStatus;
    file?: { fileName: string; mimeType: string; content: Buffer };
  }) {
    const task = await prisma.projectTask.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        payoutAmountCents: input.payoutAmountCents,
        sequence: input.sequence,
        status: input.status,
        taskBriefFileName: input.file?.fileName ?? null,
        taskBriefMimeType: input.file?.mimeType ?? null,
        taskBriefContent: input.file?.content ?? null,
      },
    });
    return taskView(task);
  },

  async updateTask(id: string, input: Partial<Pick<ProjectTaskServiceInput, "title" | "description" | "payoutAmountCents" | "status" | "sequence">> & { file?: { fileName: string; mimeType: string; content: Buffer } }) {
    const task = await prisma.projectTask.update({
      where: { id },
      data: {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.payoutAmountCents === undefined ? {} : { payoutAmountCents: input.payoutAmountCents }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.sequence === undefined ? {} : { sequence: input.sequence }),
        ...(input.file ? {
          taskBriefFileName: input.file.fileName,
          taskBriefMimeType: input.file.mimeType,
          taskBriefContent: input.file.content,
        } : {}),
      },
    });
    return taskView(task);
  },

  async claimTask(taskId: string, userId: string) {
    try {
      const assignment = await prisma.$transaction(async (tx) => {
        const task = await tx.projectTask.findUnique({ where: { id: taskId } });
        if (!task || task.status !== ProjectTaskStatus.OPEN) throw new Error("TASK_NOT_OPEN");

        const application = await tx.application.findFirst({
          where: {
            jobId: task.projectId,
            applicantUserId: userId,
            status: { in: [...eligibleApplicationStatuses] },
          },
          select: { id: true, applicantUserId: true },
        });
        if (!application) throw new Error("PROJECT_ACCESS_REQUIRED");

        const onboarding = await tx.userOnboarding.findUnique({ where: { userId }, select: { completedAt: true } });
        if (!isOnboardingReviewApproved(onboarding?.completedAt)) throw new Error("ONBOARDING_REQUIRED");

        const active = await tx.projectTaskAssignment.findFirst({
          where: { applicationId: application.id, status: ProjectTaskAssignmentStatus.IN_PROGRESS },
          select: { id: true },
        });
        if (active) throw new Error("ANOTHER_TASK_IN_PROGRESS");

        const existing = await tx.projectTaskAssignment.findUnique({ where: { taskId_applicationId: { taskId, applicationId: application.id } } });
        if (existing) throw new Error("TASK_ALREADY_TAKEN");

        return tx.projectTaskAssignment.create({
          data: { taskId, applicationId: application.id },
          select: { id: true, taskId: true, status: true },
        });
      });
      return assignment;
    } catch (error) {
      if (isUnique(error)) throw new Error("TASK_ALREADY_TAKEN");
      throw error;
    }
  },

  async getMaterial(assignmentId: string, userId: string) {
    const assignment = await prisma.projectTaskAssignment.findFirst({
      where: { id: assignmentId, application: { applicantUserId: userId }, status: ProjectTaskAssignmentStatus.IN_PROGRESS },
      select: { task: { select: { taskBriefContent: true, taskBriefFileName: true } } },
    });
    if (!assignment?.task.taskBriefContent?.length) throw new Error("TASK_BRIEF_NOT_FOUND");
    return { content: assignment.task.taskBriefContent, fileName: assignment.task.taskBriefFileName ?? "task-brief.pdf" };
  },

  async submit(assignmentId: string, userId: string, input: TaskSubmissionInput, file: { content: Buffer; mimeType: string }) {
    const assignment = await prisma.projectTaskAssignment.findFirst({
      where: { id: assignmentId, application: { applicantUserId: userId }, status: ProjectTaskAssignmentStatus.IN_PROGRESS, task: { status: ProjectTaskStatus.OPEN } },
      select: { id: true },
    });
    if (!assignment) throw new Error("TASK_NOT_SUBMITTABLE");

    await prisma.projectTaskAssignment.update({
      where: { id: assignment.id },
      data: { status: ProjectTaskAssignmentStatus.SUBMITTED, submittedAt: new Date(), submissionFileName: input.fileName, submissionFileContent: file.content, submissionMimeType: file.mimeType, submissionNotes: input.notes },
    });
    await notifyTaskSubmission(assignment.id);
    return { id: assignment.id, status: ProjectTaskAssignmentStatus.SUBMITTED };
  },

  async listAssignments() {
    return prisma.projectTaskAssignment.findMany({
      orderBy: { submittedAt: "asc" },
      where: { status: { in: [ProjectTaskAssignmentStatus.SUBMITTED, ProjectTaskAssignmentStatus.REJECTED] } },
      select: {
        id: true, status: true, submittedAt: true, submissionFileName: true, submissionNotes: true, reviewNotes: true,
        task: { select: { title: true, payoutAmountCents: true, project: { select: { id: true, title: true } } } },
        application: { select: { candidateName: true, candidateEmail: true } },
      },
    });
  },

  async autoReviewDueSubmissions(
    now = new Date(),
    limit = PROJECT_TASK_AUTO_REVIEW_BATCH_SIZE,
  ) {
    const cutoff = new Date(now.getTime() - PROJECT_TASK_AUTO_REVIEW_DELAY_MS);
    const assignments = await prisma.projectTaskAssignment.findMany({
      where: {
        status: ProjectTaskAssignmentStatus.SUBMITTED,
        submittedAt: { not: null, lte: cutoff },
      },
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      take: limit,
      select: { id: true },
    });

    const results: Array<{ assignmentId: string; result: string }> = [];

    for (const assignment of assignments) {
      try {
        await this.approve(
          assignment.id,
          null,
          "Automatically approved after the review window elapsed.",
        );
        results.push({ assignmentId: assignment.id, result: "APPROVED" });
      } catch (error) {
        if (error instanceof Error && error.message === "TASK_ALREADY_REVIEWED") {
          results.push({ assignmentId: assignment.id, result: "ALREADY_REVIEWED" });
          continue;
        }

        if (error instanceof Error && error.message === "TASK_AUTO_REVIEW_NOT_ELIGIBLE") {
          results.push({ assignmentId: assignment.id, result: "MANUAL_REVIEW_REQUIRED" });
          continue;
        }

        throw error;
      }
    }

    return results;
  },

  async approve(id: string, reviewerId: string | null, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.projectTaskAssignment.findUnique({
        where: { id },
        include: { task: true, application: true },
      });

      if (!assignment || !assignment.submittedAt) {
        throw new Error("TASK_REVIEW_NOT_FOUND");
      }

      if (assignment.status !== ProjectTaskAssignmentStatus.SUBMITTED) {
        throw new Error("TASK_ALREADY_REVIEWED");
      }

      if (!assignment.application.applicantUserId) {
        throw new Error("TASK_USER_REQUIRED");
      }

      if (
        reviewerId === null &&
        (!assignment.submissionFileContent?.length ||
          !assignment.submissionFileName?.trim())
      ) {
        throw new Error("TASK_AUTO_REVIEW_NOT_ELIGIBLE");
      }

      const claimed = await tx.projectTaskAssignment.updateMany({
        where: {
          id,
          status: ProjectTaskAssignmentStatus.SUBMITTED,
        },
        data: {
          status: ProjectTaskAssignmentStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: reviewerId,
          reviewNotes: notes ?? null,
          paymentApprovedAt: new Date(),
          paymentAmountCents: assignment.task.payoutAmountCents,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("TASK_ALREADY_REVIEWED");
      }

      await tx.ledgerEntry.create({
        data: {
          userId: assignment.application.applicantUserId,
          amountCents: assignment.task.payoutAmountCents,
          account: LedgerAccount.HOLDING,
          reason: `PROJECT_TASK_PAYOUT_HOLDING_${assignment.id}`,
          applicationId: assignment.applicationId,
          taskAssignmentId: assignment.id,
        },
      });

      await tx.user.update({
        where: { id: assignment.application.applicantUserId },
        data: {
          holdingBalanceCents: {
            increment: assignment.task.payoutAmountCents,
          },
        },
      });

      await tx.application.update({
        where: { id: assignment.applicationId },
        data: { tasksCompleted: { increment: 1 } },
      });

      return tx.projectTaskAssignment.findUniqueOrThrow({
        where: { id },
      });
    });
  },

  async review(id: string, adminId: string, decision: "approve" | "reject", notes?: string) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.projectTaskAssignment.findUnique({
        where: { id },
        include: { task: true, application: true },
      });
      if (!assignment || !assignment.submittedAt) throw new Error("TASK_REVIEW_NOT_FOUND");
      if (assignment.status !== ProjectTaskAssignmentStatus.SUBMITTED) {
        throw new Error("TASK_ALREADY_REVIEWED");
      }

      if (decision === "reject") {
        const rejected = await tx.projectTaskAssignment.updateMany({
          where: { id, status: ProjectTaskAssignmentStatus.SUBMITTED },
          data: {
            status: ProjectTaskAssignmentStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedById: adminId,
            reviewNotes: notes ?? null,
          },
        });
        if (rejected.count !== 1) throw new Error("TASK_ALREADY_REVIEWED");
        return tx.projectTaskAssignment.findUniqueOrThrow({ where: { id } });
      }

      if (!assignment.application.applicantUserId) throw new Error("TASK_USER_REQUIRED");
      const amount = assignment.task.payoutAmountCents;
      const claimed = await tx.projectTaskAssignment.updateMany({
        where: { id, status: ProjectTaskAssignmentStatus.SUBMITTED },
        data: {
          status: ProjectTaskAssignmentStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: adminId,
          reviewNotes: notes ?? null,
          paymentApprovedAt: new Date(),
          paymentAmountCents: amount,
        },
      });
      if (claimed.count !== 1) throw new Error("TASK_ALREADY_REVIEWED");

      await tx.ledgerEntry.create({
        data: { userId: assignment.application.applicantUserId, amountCents: amount, account: LedgerAccount.HOLDING, reason: `PROJECT_TASK_PAYOUT_HOLDING_${assignment.id}`, applicationId: assignment.applicationId, taskAssignmentId: assignment.id },
      });
      await tx.user.update({ where: { id: assignment.application.applicantUserId }, data: { holdingBalanceCents: { increment: amount } } });
      await tx.application.update({ where: { id: assignment.applicationId }, data: { tasksCompleted: { increment: 1 } } });
      return tx.projectTaskAssignment.findUniqueOrThrow({ where: { id } });
    });
  },
};

type ProjectTaskServiceInput = {
  title: string;
  description: string;
  payoutAmountCents: number;
  status: ProjectTaskStatus;
  sequence: number;
};
