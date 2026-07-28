import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { AdminApplicationService } from "@/lib/services/admin-application-service";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const applications = await AdminApplicationService.listApplications();

    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
