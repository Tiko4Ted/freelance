import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { ProjectTaskService } from "@/lib/services/project-task-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { notes?: string };
    const assignment = await ProjectTaskService.review(id, session.user.id, "reject", body.notes);
    return NextResponse.json({ assignment });
  } catch {
    return NextResponse.json({ error: "Unable to reject task submission" }, { status: 409 });
  }
}
