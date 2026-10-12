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
  HOME_PROJECT_LIMIT_REACHED:
    "Four projects are already published. Choose one to replace or close a published project first.",
  PROJECT_REPLACEMENT_NOT_NEEDED: "There is an open publishing slot. Publish this draft directly.",
  PROJECT_TO_REPLACE_NOT_FOUND: "Choose one currently published project to replace",
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    let replaceJobId: string | undefined;
    try {
      const body = (await _request.json()) as { replaceJobId?: unknown };
      if (typeof body.replaceJobId === "string" && body.replaceJobId.trim()) {
        replaceJobId = body.replaceJobId.trim();
      }
    } catch {
      // An empty request body is the normal path when a free slot exists.
    }

    const result = await AdminJobService.publishJob(id, replaceJobId);

    await Promise.all([
      EmailNotificationService.notifyUsersOfNewJob(result.job),
      ...result.replacedApplications.map((application) =>
        EmailNotificationService.notifyApplicationStatusChanged(application.id),
      ),
    ]);

    return NextResponse.json({ job: result.job });
  } catch (error) {
    if (error instanceof Error && publishErrors[error.message]) {
      return NextResponse.json(
        { error: publishErrors[error.message] },
        { status: error.message === "HOME_PROJECT_LIMIT_REACHED" ? 409 : 400 },
      );
    }

    return NextResponse.json({ error: "Unable to publish project" }, { status: 500 });
  }
}
