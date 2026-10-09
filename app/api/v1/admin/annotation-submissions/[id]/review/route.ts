import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import {
  AnnotationService,
  AnnotationServiceError,
} from "@/lib/services/annotation-service";
import { annotationReviewSchema } from "@/lib/validation/annotation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.REVIEWER) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await context.params;
    const input = annotationReviewSchema.parse(await request.json());
    const review = await AnnotationService.reviewSubmission(
      id,
      session.user.id,
      input,
    );
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid annotation review", issues: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof AnnotationServiceError) {
      return NextResponse.json({ error: error.code }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Unable to review annotation" },
      { status: 500 },
    );
  }
}
