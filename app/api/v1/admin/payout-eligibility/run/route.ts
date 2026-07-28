import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { PayoutEligibilityService } from "@/lib/services/payout-eligibility-service";

export async function POST() {
  try {
    await requireRole(Role.ADMIN);
    const results = await PayoutEligibilityService.runOnce();

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Unable to run payout eligibility" },
      { status: 500 },
    );
  }
}
