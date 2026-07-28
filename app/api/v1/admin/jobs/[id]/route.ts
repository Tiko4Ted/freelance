import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { AdminJobService } from "@/lib/services/admin-job-service";
import { adminUpdateJobSchema } from "@/lib/validation/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = adminUpdateJobSchema.parse(body);
    const job = await AdminJobService.updateJob(id, input);

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid job input", issues: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to update job" }, { status: 500 });
  }
}
