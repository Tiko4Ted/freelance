import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  ForbiddenError,
  UnauthorizedError,
  requireRole,
} from "@/lib/auth/session";
import { AdminBulkOperationService } from "@/lib/services/admin-bulk-operation-service";
import { adminBulkOperationSchema } from "@/lib/validation/admin";

export async function POST(request: Request) {
  try {
    await requireRole(Role.ADMIN);
    const input = adminBulkOperationSchema.parse(await request.json());
    const preview = await AdminBulkOperationService.preview(input);

    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid bulk operation filters", issues: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to preview bulk operation" }, { status: 500 });
  }
}
