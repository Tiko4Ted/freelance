import {
  AdminBulkOperationStatus,
  ApplicationStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  enqueueApplicationBulkOperation,
  parseApplicationOperationMessage,
} from "@/lib/queues/application-operation-queue";
import type { AdminBulkOperationInput } from "@/lib/validation/admin";
import { AdminApplicationService } from "@/lib/services/admin-application-service";

const MAX_PREVIEW_ROWS = 8;

type BulkFilter = Pick<
  AdminBulkOperationInput,
  "sourceStatus" | "jobId" | "olderThanHours" | "maxItems"
>;

function applicationWhere(filter: BulkFilter): Prisma.ApplicationWhereInput {
  const cutoff =
    filter.olderThanHours === null || filter.olderThanHours === undefined
      ? undefined
      : new Date(Date.now() - filter.olderThanHours * 60 * 60 * 1_000);

  return {
    job: { isActive: true, showOnHome: true },
    ...(filter.sourceStatus ? { status: filter.sourceStatus } : {}),
    ...(filter.jobId ? { jobId: filter.jobId } : {}),
    ...(cutoff ? { createdAt: { lte: cutoff } } : {}),
  };
}

function operationResponse(operation: {
  id: string;
  sourceStatus: ApplicationStatus | null;
  targetStatus: ApplicationStatus;
  jobId: string | null;
  olderThanHours: number | null;
  maxItems: number;
  scheduledAt: Date;
  status: AdminBulkOperationStatus;
  matchedCount: number;
  processedCount: number;
  changedCount: number;
  failedCount: number;
  lastError: string | null;
  completedAt: Date | null;
  createdAt: Date;
  job?: { title: string } | null;
}) {
  return {
    id: operation.id,
    sourceStatus: operation.sourceStatus,
    targetStatus: operation.targetStatus,
    jobId: operation.jobId,
    jobTitle: operation.job?.title ?? null,
    olderThanHours: operation.olderThanHours,
    maxItems: operation.maxItems,
    scheduledAt: operation.scheduledAt.toISOString(),
    status: operation.status,
    matchedCount: operation.matchedCount,
    processedCount: operation.processedCount,
    changedCount: operation.changedCount,
    failedCount: operation.failedCount,
    lastError: operation.lastError,
    completedAt: operation.completedAt?.toISOString() ?? null,
    createdAt: operation.createdAt.toISOString(),
  };
}

export const AdminBulkOperationService = {
  async preview(input: BulkFilter) {
    const where = applicationWhere(input);
    const [matchingCount, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: Math.min(input.maxItems ?? 100, MAX_PREVIEW_ROWS),
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          status: true,
          createdAt: true,
          job: { select: { title: true } },
        },
      }),
    ]);

    return {
      matchingCount,
      applications: applications.map((application) => ({
        id: application.id,
        candidateName: application.candidateName,
        candidateEmail: application.candidateEmail,
        status: application.status,
        createdAt: application.createdAt.toISOString(),
        jobTitle: application.job.title,
      })),
    };
  },

  async listJobs() {
    return prisma.job.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, isActive: true },
    });
  },

  async listOperations() {
    const operations = await prisma.adminBulkOperation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { job: { select: { title: true } } },
    });

    return operations.map(operationResponse);
  },

  async schedule(input: AdminBulkOperationInput, createdById: string) {
    const scheduledAt = new Date(Date.now() + input.delayHours * 60 * 60 * 1_000);
    const planned = await this.preview(input);
    const operation = await prisma.adminBulkOperation.create({
      data: {
        createdById,
        sourceStatus: input.sourceStatus ?? null,
        targetStatus: input.targetStatus,
        jobId: input.jobId ?? null,
        olderThanHours: input.olderThanHours ?? null,
        maxItems: input.maxItems,
        scheduledAt,
        matchedCount: planned.matchingCount,
      },
      include: { job: { select: { title: true } } },
    });

    try {
      await enqueueApplicationBulkOperation(
        operation.id,
        input.delayHours * 60 * 60,
      );
    } catch (error) {
      await prisma.adminBulkOperation.update({
        where: { id: operation.id },
        data: {
          status: AdminBulkOperationStatus.FAILED,
          lastError: error instanceof Error ? error.message.slice(0, 1_000) : "QUEUE_PUBLISH_FAILED",
          completedAt: new Date(),
        },
      });
      throw error;
    }

    return operationResponse(operation);
  },

  async execute(id: string) {
    const claimed = await prisma.adminBulkOperation.updateMany({
      where: {
        id,
        status: AdminBulkOperationStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
      data: { status: AdminBulkOperationStatus.PROCESSING },
    });

    if (claimed.count !== 1) {
      return;
    }

    const operation = await prisma.adminBulkOperation.findUniqueOrThrow({
      where: { id },
    });
    const applications = await prisma.application.findMany({
      where: applicationWhere({
        sourceStatus: operation.sourceStatus,
        jobId: operation.jobId,
        olderThanHours: operation.olderThanHours,
        maxItems: operation.maxItems,
      }),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: operation.maxItems,
      select: { id: true, status: true },
    });

    await prisma.adminBulkOperation.update({
      where: { id },
      data: { matchedCount: applications.length },
    });

    let processedCount = 0;
    let changedCount = 0;
    let failedCount = 0;
    let lastError: string | null = null;

    for (const application of applications) {
      try {
        await AdminApplicationService.updateStatus(application.id, {
          status: operation.targetStatus,
        });
        processedCount += 1;
        if (application.status !== operation.targetStatus) {
          changedCount += 1;
        }
      } catch (error) {
        processedCount += 1;
        failedCount += 1;
        lastError = error instanceof Error ? error.message.slice(0, 1_000) : "APPLICATION_UPDATE_FAILED";
      }

      await prisma.adminBulkOperation.update({
        where: { id },
        data: { processedCount, changedCount, failedCount, lastError },
      });
    }

    await prisma.adminBulkOperation.update({
      where: { id },
      data: {
        status: failedCount ? AdminBulkOperationStatus.FAILED : AdminBulkOperationStatus.COMPLETED,
        completedAt: new Date(),
        lastError,
      },
    });
  },
};

export async function processApplicationOperationMessage(payload: unknown) {
  const { operationId } = parseApplicationOperationMessage(payload);
  await AdminBulkOperationService.execute(operationId);
}
