import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import {
  AnnotationService,
  AnnotationServiceError,
} from "@/lib/services/annotation-service";

type RouteContext = { params: Promise<{ jobId: string }> };

function errorResponse(error: unknown) {
  if (!(error instanceof AnnotationServiceError)) {
    return NextResponse.json(
      { error: "Unable to open annotation task" },
      { status: 500 },
    );
  }

  const status =
    error.code === "ANNOTATION_ACCESS_DENIED"
      ? 403
      : error.code === "NO_ANNOTATION_TASKS_AVAILABLE"
        ? 409
        : 404;
  return NextResponse.json({ error: error.code }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { jobId } = await context.params;
    const assignment = await AnnotationService.getOrCreateAssignment(
      jobId,
      session.user.id,
    );
    return NextResponse.json(assignment);
  } catch (error) {
    return errorResponse(error);
  }
}
