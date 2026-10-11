import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        taskBriefContent: true,
        taskBriefFileName: true,
        taskBriefMimeType: true,
      },
    });

    if (!job?.taskBriefContent) {
      return NextResponse.json({ error: "Project brief not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(job.taskBriefContent), {
      headers: {
        "Content-Disposition": `inline; filename="${job.taskBriefFileName ?? "project-brief.pdf"}"`,
        "Content-Type": job.taskBriefMimeType ?? "application/pdf",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to download project brief" }, { status: 404 });
  }
}
