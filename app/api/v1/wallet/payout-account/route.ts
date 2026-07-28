import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { PayoutAccountService } from "@/lib/services/payout-account-service";

export async function POST() {
  try {
    const session = await requireSession();
    const account = await PayoutAccountService.startOnboarding(session.user.id);

    return NextResponse.json({ account });
  } catch {
    return NextResponse.json(
      { error: "Unable to start payout onboarding" },
      { status: 500 },
    );
  }
}
