import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { ApplicationService } from "@/lib/services/application-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const material = await ApplicationService.getTaskMaterial(
      id,
      session.user.email ?? "",
    );

    return new NextResponse(material.content, {
      headers: {
        "Content-Disposition": `attachment; filename="${material.fileName}"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to download task material" },
      { status: 404 },
    );
  }
}
