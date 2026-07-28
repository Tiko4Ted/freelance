import { ApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type {
  AdminProgressInput,
  AdminStatusInput,
} from "@/lib/validation/admin";

function addThreeMonths(date: Date) {
  const deadline = new Date(date);
  deadline.setMonth(deadline.getMonth() + 3);
  return deadline;
}

function toApplicationResponse(application: {
  id: string;
  candidateName: string;
  candidateEmail: string;
  status: ApplicationStatus;
  lockedPayoutCents: number | null;
  hoursLogged: number;
  tasksCompleted: number;
  onboardedAt: Date | null;
  payoutDeadline: Date | null;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    payoutType: string;
  };
  referral: {
    referrer: {
      id: string;
      email: string;
      name: string;
    };
  } | null;
}) {
  return {
    id: application.id,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    status: application.status,
    lockedPayoutCents: application.lockedPayoutCents,
    hoursLogged: application.hoursLogged,
    tasksCompleted: application.tasksCompleted,
    onboardedAt: application.onboardedAt?.toISOString() ?? null,
    payoutDeadline: application.payoutDeadline?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    job: application.job,
    referrer: application.referral?.referrer ?? null,
  };
}

const applicationSelect = {
  id: true,
  candidateName: true,
  candidateEmail: true,
  status: true,
  lockedPayoutCents: true,
  hoursLogged: true,
  tasksCompleted: true,
  onboardedAt: true,
  payoutDeadline: true,
  createdAt: true,
  job: {
    select: {
      id: true,
      title: true,
      payoutType: true,
    },
  },
  referral: {
    select: {
      referrer: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  },
};

export const AdminApplicationService = {
  async listApplications() {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      select: applicationSelect,
    });

    return applications.map(toApplicationResponse);
  },

  async updateStatus(id: string, input: AdminStatusInput) {
    const now = new Date();
    const activationData =
      input.status === ApplicationStatus.ACTIVE
        ? {
            onboardedAt: now,
            payoutDeadline: addThreeMonths(now),
          }
        : {};

    const application = await prisma.application.update({
      where: { id },
      data: {
        status: input.status,
        ...activationData,
      },
      select: applicationSelect,
    });

    return toApplicationResponse(application);
  },

  async logProgress(id: string, input: AdminProgressInput) {
    const application = await prisma.application.update({
      where: { id },
      data: {
        hoursLogged: input.hoursLogged,
        tasksCompleted: input.tasksCompleted,
      },
      select: applicationSelect,
    });

    return toApplicationResponse(application);
  },
};
