import { KycReviewStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { AdminKycService } from "@/lib/services/admin-kyc-service";
import { adminKycReviewSchema } from "@/lib/validation/admin";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { userId } = await context.params;
    const input = adminKycReviewSchema.parse(await request.json());
    const review = await AdminKycService.updateReview(
      userId,
      input.status as KycReviewStatus,
      input.note,
    );

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid KYC review input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "KYC_RECORD_NOT_FOUND") {
      return NextResponse.json({ error: "KYC record not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "KYC_IDENTITY_NOT_VERIFIED") {
      return NextResponse.json(
        { error: "Identity verification is not ready for review" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Unable to update KYC review" }, { status: 500 });
  }
}
