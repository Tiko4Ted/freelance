import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import {
  AnnotationService,
  AnnotationServiceError,
} from "@/lib/services/annotation-service";
import { annotationSubmissionSchema } from "@/lib/validation/annotation";

type RouteContext = { params: Promise<{ assignmentId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { assignmentId } = await context.params;
    const input = annotationSubmissionSchema.parse(await request.json());
    const submission = await AnnotationService.submitAssignment(
      assignmentId,
      session.user.id,
      input,
    );

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid annotation submission", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof AnnotationServiceError) {
      const status =
        error.code === "ANNOTATION_ASSIGNMENT_EXPIRED" ? 409 : 404;
      return NextResponse.json({ error: error.code }, { status });
    }

    return NextResponse.json(
      { error: "Unable to submit annotation" },
      { status: 500 },
    );
  }
}
