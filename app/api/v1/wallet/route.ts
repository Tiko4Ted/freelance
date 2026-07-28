import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { LedgerService } from "@/lib/services/ledger-service";

export async function GET() {
  try {
    const session = await requireSession();
    const wallet = await LedgerService.getWallet(session.user.id);

    return NextResponse.json({ wallet });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
