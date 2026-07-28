import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { AdminApplicationService } from "@/lib/services/admin-application-service";
import { adminProgressSchema } from "@/lib/validation/admin";

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
    const input = adminProgressSchema.parse(body);
    const application = await AdminApplicationService.logProgress(id, input);

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid progress input", issues: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to update application progress" },
      { status: 500 },
    );
  }
}
