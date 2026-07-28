import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { ReferralService } from "@/lib/services/referral-service";

export async function GET() {
  try {
    const session = await requireSession();
    const applications = await ReferralService.getMyApplications(
      session.user.id,
    );

    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
