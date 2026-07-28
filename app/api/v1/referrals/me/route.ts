import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { ReferralService } from "@/lib/services/referral-service";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const origin = new URL(request.url).origin;
    const referrals = await ReferralService.getMyLinks(session.user.id, origin);

    return NextResponse.json(referrals);
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
