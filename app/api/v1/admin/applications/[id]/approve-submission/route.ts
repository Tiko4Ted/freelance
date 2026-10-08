import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { AdminApplicationService } from "@/lib/services/admin-application-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const application = await AdminApplicationService.approveTaskSubmission(id);

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_SUBMISSION_NOT_PENDING") {
      return NextResponse.json(
        { error: "This application does not have a pending task submission" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to approve task submission" },
      { status: 500 },
    );
  }
}
