import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import { ApplicationService } from "@/lib/services/application-service";
import {
  MAX_TASK_SUBMISSION_BYTES,
  taskSubmissionSchema,
} from "@/lib/validation/task-submission";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A completed work file is required" },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_TASK_SUBMISSION_BYTES) {
      return NextResponse.json(
        { error: "The completed work file must be between 1 byte and 4 MB" },
        { status: 400 },
      );
    }

    const rawNotes = formData.get("notes");
    const input = taskSubmissionSchema.parse({
      fileName: file.name.replace(/[\\/\0]/g, "_").trim(),
      notes: typeof rawNotes === "string" ? rawNotes : "",
    });
    const fileContent = Buffer.from(await file.arrayBuffer());

    await ApplicationService.submitTask(id, session.user.id, input, {
      content: fileContent,
      mimeType: file.type || "application/octet-stream",
    });

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
