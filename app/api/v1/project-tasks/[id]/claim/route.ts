import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { ProjectTaskService } from "@/lib/services/project-task-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const assignment = await ProjectTaskService.claimTask(id, session.user.id);
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = ["TASK_NOT_OPEN", "TASK_ALREADY_TAKEN", "ANOTHER_TASK_IN_PROGRESS"].includes(message) ? 409 : ["PROJECT_ACCESS_REQUIRED", "ONBOARDING_REQUIRED"].includes(message) ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: message === "ANOTHER_TASK_IN_PROGRESS" ? "Complete or submit your current task before starting another" : "Unable to start this task" }, { status });
  }
}
