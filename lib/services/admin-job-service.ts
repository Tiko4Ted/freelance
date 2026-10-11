import {
  Prisma,
  ApplicationStatus,
  AnnotationAssignmentStatus,
  AnnotationTaskStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  homeProjectPricingError,
  HomeProjectPricingError,
} from "@/lib/home-project-pricing";
import type {
  AdminCreateJobInput,
  AdminUpdateJobInput,
} from "@/lib/validation/admin";
import { aptitudeTestDefinitionSchema } from "@/lib/aptitude-test";

const adminJobInclude = {
  skills: {
    orderBy: { label: "asc" as const },
  },
};

function toJobResponse(job: {
  id: string;
  title: string;
  description: string;
  payoutAmountCents: number;
  payoutType: string;
  currency: string;
  companyName: string;
  openings: number;
  hourlyMinCents: number | null;
  hourlyMaxCents: number | null;
  postedAt: Date;
  isHighDemand: boolean;
  showOnHome: boolean;
  isAiTask: boolean;
  isActive: boolean;
  taskBriefFileName: string | null;
  taskBriefMimeType: string | null;
  taskBriefContent: Buffer | null;
  aptitudeTest: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  skills?: { id: string; label: string }[];
  _count?: { applications: number };
}) {
  const { _count, taskBriefContent, aptitudeTest, ...jobData } = job;
  const parsedAptitude = aptitudeTestDefinitionSchema.safeParse(aptitudeTest);

  return {
    ...jobData,
    applicationCount: _count?.applications ?? 0,
    hasTaskBrief: Boolean(taskBriefContent?.length),
    aptitudeQuestionCount: parsedAptitude.success
      ? parsedAptitude.data.questions.length
      : 0,
    postedAt: job.postedAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function assertPublishable(tx: Prisma.TransactionClient, id: string) {
  const job = await tx.job.findUnique({
    where: { id },
    select: {
      isActive: true,
      showOnHome: true,
      taskBriefContent: true,
      aptitudeTest: true,
    },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (!job.isActive) {
    throw new Error("PROJECT_CLOSED");
  }

  if (!job.taskBriefContent?.length) {
    throw new Error("PROJECT_BRIEF_REQUIRED");
  }

  if (!aptitudeTestDefinitionSchema.safeParse(job.aptitudeTest).success) {
    throw new Error("APTITUDE_TEST_REQUIRED");
  }

  if (!job.showOnHome) {
    const publishedCount = await tx.job.count({
      where: {
        isActive: true,
        showOnHome: true,
        id: { not: id },
      },
    });

    if (publishedCount >= 4) {
      throw new Error("HOME_PROJECT_LIMIT_REACHED");
    }
  }
}

export const AdminJobService = {
  async listJobs() {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ...adminJobInclude,
        _count: { select: { applications: true } },
      },
    });

    return jobs.map(toJobResponse);
  },

  async createJob(
    input: AdminCreateJobInput,
    taskBrief?: AdminTaskBriefUpload,
  ) {
    const pricingError = homeProjectPricingError(input);
    if (pricingError) {
      throw new HomeProjectPricingError(pricingError);
    }

    const { skills, aptitudeTest, ...jobInput } = input;
    const job = await prisma.job.create({
      data: {
        ...jobInput,
        isAiTask: true,
        aptitudeTest: aptitudeTest
          ? (aptitudeTest as Prisma.InputJsonValue)
          : undefined,
        taskBriefFileName: taskBrief?.fileName ?? null,
        taskBriefMimeType: taskBrief?.mimeType ?? null,
        taskBriefContent: taskBrief?.content ?? null,
        skills: {
          create: skills.map((label) => ({ label })),
        },
      },
      include: adminJobInclude,
    });

    return toJobResponse(job);
  },

  async updateJob(id: string, input: AdminUpdateJobInput) {
    const { skills, aptitudeTest, ...jobInput } = input;
    const result = await prisma.$transaction(async (tx) => {
      const previousJob = await tx.job.findUniqueOrThrow({
        where: { id },
        select: {
          showOnHome: true,
          payoutType: true,
          payoutAmountCents: true,
        },
      });
      if (input.showOnHome === true && !previousJob.showOnHome) {
        await assertPublishable(tx, id);
      }
      const updatedJob = await tx.job.update({
        where: { id },
        data: {
          ...jobInput,
          isAiTask: true,
          ...(aptitudeTest === undefined
            ? {}
            : {
                aptitudeTest: aptitudeTest
                  ? (aptitudeTest as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              }),
        },
        include: adminJobInclude,
      });
      const pricingError = homeProjectPricingError(updatedJob);
      if (pricingError) {
        throw new HomeProjectPricingError(pricingError);
      }

      if (skills) {
        await tx.jobSkill.deleteMany({ where: { jobId: id } });
        await tx.jobSkill.createMany({
          data: skills.map((label) => ({ jobId: id, label })),
        });

        const job = await tx.job.findUniqueOrThrow({
          where: { id },
          include: adminJobInclude,
        });

        return { job, wasShownOnHome: previousJob.showOnHome };
      }

      return {
        job: updatedJob,
        wasShownOnHome: previousJob.showOnHome,
      };
    });

    return {
      job: toJobResponse(result.job),
      wasShownOnHome: result.wasShownOnHome,
    };
  },

  async publishJob(id: string) {
    const job = await prisma.$transaction(async (tx) => {
      await assertPublishable(tx, id);

      return tx.job.update({
        where: { id },
        data: {
          isActive: true,
          showOnHome: true,
          postedAt: new Date(),
        },
        include: {
          ...adminJobInclude,
          _count: { select: { applications: true } },
        },
      });
    });

    return toJobResponse(job);
  },

  async closeJob(id: string) {
    const result = await prisma.$transaction(
      async (tx) => {
        const job = await tx.job.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!job) {
          throw new Error("JOB_NOT_FOUND");
        }

        const applicationsToClose = await tx.application.findMany({
          where: {
            jobId: id,
            taskSubmittedAt: null,
            status: {
              in: [
                ApplicationStatus.APPLIED,
                ApplicationStatus.CERTIFYING,
                ApplicationStatus.CERTIFIED,
                ApplicationStatus.MATCHED,
                ApplicationStatus.ACTIVE,
              ],
            },
          },
          select: { id: true, status: true },
        });

        if (applicationsToClose.length) {
          await tx.application.updateMany({
            where: {
              id: { in: applicationsToClose.map((application) => application.id) },
            },
            data: { status: ApplicationStatus.CLOSED },
          });
        }

        const annotationProject = await tx.annotationProject.findUnique({
          where: { jobId: id },
          select: { id: true },
        });

        let expiredAssignments = 0;
        let reopenedTasks = 0;

        if (annotationProject) {
          const expired = await tx.annotationAssignment.updateMany({
            where: {
              task: { projectId: annotationProject.id },
              status: AnnotationAssignmentStatus.IN_PROGRESS,
            },
            data: { status: AnnotationAssignmentStatus.EXPIRED },
          });
          expiredAssignments = expired.count;

          const reopened = await tx.annotationTask.updateMany({
            where: {
              projectId: annotationProject.id,
              status: AnnotationTaskStatus.ASSIGNED,
            },
            data: { status: AnnotationTaskStatus.UNASSIGNED },
          });
          reopenedTasks = reopened.count;
        }

        const closedJob = await tx.job.update({
          where: { id },
          data: {
            isActive: false,
            showOnHome: false,
            openings: 0,
          },
          include: adminJobInclude,
        });

        return {
          job: closedJob,
          closedApplications: applicationsToClose,
          expiredAssignments,
          reopenedTasks,
        };
      },
      { maxWait: 30000, timeout: 30000 },
    );

    return {
      job: toJobResponse(result.job),
      closedApplications: result.closedApplications,
      expiredAssignments: result.expiredAssignments,
      reopenedTasks: result.reopenedTasks,
    };
  },
};

export type AdminTaskBriefUpload = {
  fileName: string;
  mimeType: string;
  content: Buffer;
};
