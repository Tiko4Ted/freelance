import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { PayoutAccountService } from "@/lib/services/payout-account-service";

export async function GET() {
  try {
    const session = await requireSession();
    const account = await PayoutAccountService.getStatus(session.user.id);

    return NextResponse.json({ account });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
