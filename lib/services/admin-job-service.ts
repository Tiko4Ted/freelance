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

async function assertPublishable(
  tx: Prisma.TransactionClient,
  id: string,
  replaceJobId?: string,
) {
  const job = await tx.job.findUnique({
    where: { id },
    select: {
      isActive: true,
      showOnHome: true,
      taskBriefContent: true,
      aptitudeTest: true,
      projectTasks: {
        where: { status: "OPEN" },
        select: { id: true, taskBriefContent: true },
      },
    },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (!job.isActive) {
    throw new Error("PROJECT_CLOSED");
  }

  const hasProjectTaskBrief = job.projectTasks.some((task) => task.taskBriefContent?.length);
  if (!job.taskBriefContent?.length && !hasProjectTaskBrief) {
    throw new Error("PROJECT_BRIEF_REQUIRED");
  }

  if (!aptitudeTestDefinitionSchema.safeParse(job.aptitudeTest).success) {
    throw new Error("APTITUDE_TEST_REQUIRED");
  }

  const publishedCount = await tx.job.count({
    where: {
      isActive: true,
      showOnHome: true,
      id: { not: id },
    },
  });

  if (replaceJobId && publishedCount < 2) {
    throw new Error("PROJECT_REPLACEMENT_NOT_NEEDED");
  }

  if (replaceJobId) {
    const replacement = await tx.job.findFirst({
      where: { id: replaceJobId, isActive: true, showOnHome: true },
      select: { id: true },
    });

    if (!replacement || replaceJobId === id) {
      throw new Error("PROJECT_TO_REPLACE_NOT_FOUND");
    }
  }

  if (!job.showOnHome) {
    if (publishedCount >= 2 && !replaceJobId) {
      throw new Error("HOME_PROJECT_LIMIT_REACHED");
    }
  }
}

async function closeJobWithinTransaction(tx: Prisma.TransactionClient, id: string) {
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

  await tx.projectTask.updateMany({
    where: { projectId: id, status: "OPEN" },
    data: { status: "CLOSED" },
  });
  await tx.projectTaskAssignment.updateMany({
    where: { task: { projectId: id }, status: "IN_PROGRESS" },
    data: { status: "CANCELLED" },
  });

  if (applicationsToClose.length) {
    await tx.application.updateMany({
      where: { id: { in: applicationsToClose.map((application) => application.id) } },
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
    data: { isActive: false, showOnHome: false, openings: 0 },
    include: adminJobInclude,
  });

  return {
    job: closedJob,
    closedApplications: applicationsToClose,
    expiredAssignments,
    reopenedTasks,
  };
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

  async publishJob(id: string, replaceJobId?: string) {
    const job = await prisma.$transaction(async (tx) => {
      await assertPublishable(tx, id, replaceJobId);

      let replaced;
      if (replaceJobId) {
        replaced = await closeJobWithinTransaction(tx, replaceJobId);
      }

      const publishedJob = await tx.job.update({
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

      return { publishedJob, replaced };
    });

    return {
      job: toJobResponse(job.publishedJob),
      replacedApplications: job.replaced?.closedApplications ?? [],
    };
  },

  async closeJob(id: string) {
    const result = await prisma.$transaction(
      (tx) => closeJobWithinTransaction(tx, id),
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
