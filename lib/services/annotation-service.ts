import {
  AnnotationAssignmentStatus,
  AnnotationReviewGrade,
  AnnotationTaskStatus,
  ApplicationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type {
  AnnotationReviewInput,
  AnnotationSubmissionInput,
} from "@/lib/validation/annotation";

const ASSIGNMENT_MINUTES = 60;

export class AnnotationServiceError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const taskInclude = {
  project: {
    include: {
      job: { select: { id: true, title: true, description: true } },
    },
  },
} satisfies Prisma.AnnotationTaskInclude;

function toTaskResponse(task: Prisma.AnnotationTaskGetPayload<{
  include: typeof taskInclude;
}>) {
  return {
    id: task.id,
    status: task.status,
    isGoldStandard: task.isGoldStandard,
    systemInstruction: task.systemInstruction,
    prompt: task.prompt,
    constraints: task.constraints,
    modelOutputs: task.modelOutputs,
    metadata: task.metadata,
    project: {
      id: task.project.id,
      title: task.project.job.title,
      description: task.project.description,
      taskType: task.project.taskType,
      version: task.project.version,
      rubricSchema: task.project.rubricSchema,
    },
  };
}

export const AnnotationService = {
  async getOrCreateAssignment(jobId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.annotationProject.findUnique({
        where: { jobId },
        include: { job: { select: { showOnHome: true } } },
      });

      if (!project || !project.job.showOnHome) {
        throw new AnnotationServiceError("ANNOTATION_PROJECT_NOT_FOUND");
      }

      const application = await tx.application.findFirst({
        where: {
          jobId,
          applicantUserId: userId,
          status: {
            in: [
              ApplicationStatus.CERTIFIED,
              ApplicationStatus.MATCHED,
              ApplicationStatus.ACTIVE,
            ],
          },
        },
        select: { id: true },
      });

      if (!application) {
        throw new AnnotationServiceError("ANNOTATION_ACCESS_DENIED");
      }

      const now = new Date();
      await tx.annotationAssignment.updateMany({
        where: {
          userId,
          status: AnnotationAssignmentStatus.IN_PROGRESS,
          expiresAt: { lte: now },
          task: { projectId: project.id },
        },
        data: { status: AnnotationAssignmentStatus.EXPIRED },
      });

      const currentAssignment = await tx.annotationAssignment.findFirst({
        where: {
          userId,
          status: AnnotationAssignmentStatus.IN_PROGRESS,
          expiresAt: { gt: now },
          task: { projectId: project.id },
        },
        include: { task: { include: taskInclude } },
      });

      if (currentAssignment) {
        return {
          assignmentId: currentAssignment.id,
          expiresAt: currentAssignment.expiresAt,
          task: toTaskResponse(currentAssignment.task),
        };
      }

      const task = await tx.annotationTask.findFirst({
        where: {
          projectId: project.id,
          status: AnnotationTaskStatus.UNASSIGNED,
        },
        orderBy: { createdAt: "asc" },
        include: taskInclude,
      });

      if (!task) {
        throw new AnnotationServiceError("NO_ANNOTATION_TASKS_AVAILABLE");
      }

      const expiresAt = new Date(
        now.getTime() + ASSIGNMENT_MINUTES * 60 * 1000,
      );
      const assignment = await tx.annotationAssignment.create({
        data: {
          taskId: task.id,
          userId,
          applicationId: application.id,
          expiresAt,
        },
      });

      await tx.annotationTask.update({
        where: { id: task.id },
        data: { status: AnnotationTaskStatus.ASSIGNED },
      });

      await tx.annotationProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      return {
        assignmentId: assignment.id,
        expiresAt,
        task: toTaskResponse(task),
      };
    });
  },

  async submitAssignment(
    assignmentId: string,
    userId: string,
    input: AnnotationSubmissionInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.annotationAssignment.findUnique({
        where: { id: assignmentId },
        include: { task: true },
      });

      if (
        !assignment ||
        assignment.userId !== userId ||
        assignment.status !== AnnotationAssignmentStatus.IN_PROGRESS
      ) {
        throw new AnnotationServiceError("ANNOTATION_ASSIGNMENT_NOT_ACTIVE");
      }

      if (assignment.expiresAt <= new Date()) {
        await tx.annotationAssignment.update({
          where: { id: assignment.id },
          data: { status: AnnotationAssignmentStatus.EXPIRED },
        });
        throw new AnnotationServiceError("ANNOTATION_ASSIGNMENT_EXPIRED");
      }

      const submission = await tx.annotationSubmission.create({
        data: {
          taskId: assignment.taskId,
          assignmentId: assignment.id,
          annotatorId: userId,
          evaluationData: input.evaluationData as Prisma.InputJsonValue,
          timeSpentSeconds: input.timeSpentSeconds,
        },
      });

      await tx.annotationAssignment.update({
        where: { id: assignment.id },
        data: { status: AnnotationAssignmentStatus.SUBMITTED },
      });
      await tx.annotationTask.update({
        where: { id: assignment.taskId },
        data: { status: AnnotationTaskStatus.COMPLETED },
      });

      const profile = await tx.annotationProfile.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });
      const completed = profile.tasksCompleted + 1;
      const averageTimePerTaskSec = input.timeSpentSeconds
        ? Math.round(
            ((profile.averageTimePerTaskSec * profile.tasksCompleted +
              input.timeSpentSeconds) /
              completed),
          )
        : profile.averageTimePerTaskSec;

      await tx.annotationProfile.update({
        where: { userId },
        data: { tasksCompleted: completed, averageTimePerTaskSec },
      });

      return { id: submission.id, status: assignment.status };
    });
  },

  async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    input: AnnotationReviewInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const submission = await tx.annotationSubmission.findUnique({
        where: { id: submissionId },
        include: { assignment: true, task: true },
      });

      if (!submission) {
        throw new AnnotationServiceError("ANNOTATION_SUBMISSION_NOT_FOUND");
      }

      const review = await tx.annotationReview.create({
        data: {
          submissionId,
          reviewerId,
          grade: input.grade as AnnotationReviewGrade,
          qualityScore: input.qualityScore,
          feedbackText: input.feedbackText,
        },
      });

      if (input.grade !== "APPROVED") {
        await tx.annotationTask.update({
          where: { id: submission.taskId },
          data: { status: AnnotationTaskStatus.DISPUTED },
        });
      }

      return review;
    });
  },
};
