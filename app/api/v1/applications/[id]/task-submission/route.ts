import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import { ApplicationService } from "@/lib/services/application-service";
import { taskSubmissionSchema } from "@/lib/validation/task-submission";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = taskSubmissionSchema.parse(body);

    await ApplicationService.submitTask(id, session.user.email ?? "", input);

    return NextResponse.json({
      application: {
        id,
        status: "CERTIFYING",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid task submission", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "TASK_NOT_SUBMITTABLE") {
      return NextResponse.json(
        { error: "This task cannot be submitted or has already been submitted" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to submit task" },
      { status: 500 },
    );
  }
}
