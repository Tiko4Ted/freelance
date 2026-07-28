import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { WithdrawalService } from "@/lib/services/withdrawal-service";

export async function POST() {
  try {
    await requireRole(Role.ADMIN);
    const results = await WithdrawalService.processPending();

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Unable to process withdrawals" },
      { status: 500 },
    );
  }
}
