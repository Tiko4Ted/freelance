import { ProjectTaskStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { ProjectTaskService } from "@/lib/services/project-task-service";

const taskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(5000),
  payoutAmountCents: z.coerce.number().int().positive(),
  sequence: z.coerce.number().int().positive(),
  status: z.nativeEnum(ProjectTaskStatus).default(ProjectTaskStatus.DRAFT),
});

export async function GET(request: Request) {
  await requireRole(Role.ADMIN);
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  return NextResponse.json({ tasks: await ProjectTaskService.listForProject(projectId) });
}

export async function POST(request: Request) {
  try {
    await requireRole(Role.ADMIN);
    const formData = await request.formData();
    const input = taskSchema.parse(Object.fromEntries(formData.entries()));
    const file = formData.get("file");
    const task = await ProjectTaskService.createTask({ ...input, file: file instanceof File && file.size > 0 ? { fileName: file.name, mimeType: file.type || "application/pdf", content: Buffer.from(await file.arrayBuffer()) } : undefined });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid task input", issues: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Unable to create task" }, { status: 500 });
  }
}
