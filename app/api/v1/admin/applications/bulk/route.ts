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

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const [operations, jobs] = await Promise.all([
      AdminBulkOperationService.listOperations(),
      AdminBulkOperationService.listJobs(),
    ]);

    return NextResponse.json({ operations, jobs });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(Role.ADMIN);
    const input = adminBulkOperationSchema.parse(await request.json());
    const operation = await AdminBulkOperationService.schedule(input, session.user.id);

    return NextResponse.json({ operation }, { status: 202 });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid bulk operation", issues: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to schedule bulk operation" }, { status: 500 });
  }
}
