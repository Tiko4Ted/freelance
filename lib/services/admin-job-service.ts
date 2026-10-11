import {
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
  createdAt: Date;
  updatedAt: Date;
  skills?: { id: string; label: string }[];
  _count?: { applications: number };
}) {
  const { _count, ...jobData } = job;

  return {
    ...jobData,
    applicationCount: _count?.applications ?? 0,
    postedAt: job.postedAt.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
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

  async createJob(input: AdminCreateJobInput) {
    const pricingError = homeProjectPricingError(input);
    if (pricingError) {
      throw new HomeProjectPricingError(pricingError);
    }

    const { skills, ...jobInput } = input;
    const job = await prisma.job.create({
      data: {
        ...jobInput,
        isAiTask: true,
        skills: {
          create: skills.map((label) => ({ label })),
        },
      },
      include: adminJobInclude,
    });

    return toJobResponse(job);
  },

  async updateJob(id: string, input: AdminUpdateJobInput) {
    const { skills, ...jobInput } = input;
    const result = await prisma.$transaction(async (tx) => {
      const previousJob = await tx.job.findUniqueOrThrow({
        where: { id },
        select: {
          showOnHome: true,
          payoutType: true,
          payoutAmountCents: true,
        },
      });
      const updatedJob = await tx.job.update({
        where: { id },
        data: {
          ...jobInput,
          isAiTask: true,
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
