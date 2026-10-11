import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { EmailNotificationService } from "@/lib/services/email-notification-service";
import { AdminJobService } from "@/lib/services/admin-job-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const publishErrors: Record<string, string> = {
  JOB_NOT_FOUND: "Project not found",
  PROJECT_CLOSED: "Closed projects stay closed. Create a new project for a fresh run.",
  PROJECT_BRIEF_REQUIRED: "Upload a PDF project brief before publishing",
  APTITUDE_TEST_REQUIRED: "Add a valid 15-question aptitude test before publishing",
  HOME_PROJECT_LIMIT_REACHED: "Only four projects can be published on home at once",
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const job = await AdminJobService.publishJob(id);

    await EmailNotificationService.notifyUsersOfNewJob(job);

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof Error && publishErrors[error.message]) {
      return NextResponse.json(
        { error: publishErrors[error.message] },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to publish project" }, { status: 500 });
  }
}
