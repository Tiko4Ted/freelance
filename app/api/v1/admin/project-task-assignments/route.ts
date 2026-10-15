import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { ProjectTaskService } from "@/lib/services/project-task-service";

export async function GET() {
  await requireRole(Role.ADMIN);
  return NextResponse.json({ assignments: await ProjectTaskService.listAssignments() });
}
