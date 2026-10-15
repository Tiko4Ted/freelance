import { ProjectTaskStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { ProjectTaskService } from "@/lib/services/project-task-service";

type RouteContext = { params: Promise<{ id: string }> };
const patchSchema = z.object({ title: z.string().trim().min(3).max(180).optional(), description: z.string().trim().min(10).max(5000).optional(), payoutAmountCents: z.number().int().positive().optional(), sequence: z.number().int().positive().optional(), status: z.nativeEnum(ProjectTaskStatus).optional() });

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const task = await ProjectTaskService.updateTask(id, patchSchema.parse(await request.json()));
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task input", issues: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Unable to update task" }, { status: 500 });
  }
}
