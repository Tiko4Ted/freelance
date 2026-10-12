import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { EmailNotificationService } from "@/lib/services/email-notification-service";
import { AdminJobService } from "@/lib/services/admin-job-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const result = await AdminJobService.closeJob(id);

    await Promise.all(
      result.closedApplications.map((application) =>
        EmailNotificationService.notifyApplicationStatusChanged(
          application.id,
          application.status,
        ),
      ),
    );

    return NextResponse.json({
      job: result.job,
      closedApplications: result.closedApplications.length,
      expiredAssignments: result.expiredAssignments,
      reopenedTasks: result.reopenedTasks,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Unable to close project" },
      { status: 500 },
    );
  }
}
