import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { AdminKycService } from "@/lib/services/admin-kyc-service";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    return NextResponse.json({ reviews: await AdminKycService.listReviews() });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
