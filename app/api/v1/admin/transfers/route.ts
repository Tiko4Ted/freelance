import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { WalletTransferService } from "@/lib/services/wallet-transfer-service";

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    return NextResponse.json({ transfers: await WalletTransferService.listPendingTransfers() });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
