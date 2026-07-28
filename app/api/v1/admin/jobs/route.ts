import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { AdminJobService } from "@/lib/services/admin-job-service";
import { adminCreateJobSchema } from "@/lib/validation/admin";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const jobs = await AdminJobService.listJobs();

    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(Role.ADMIN);
    const body: unknown = await request.json();
    const input = adminCreateJobSchema.parse(body);
    const job = await AdminJobService.createJob(input);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid job input", issues: error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to create job" }, { status: 500 });
  }
}
