import { Role, WalletTransferStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { WalletTransferService } from "@/lib/services/wallet-transfer-service";
import { adminWalletTransferReviewSchema } from "@/lib/validation/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole(Role.ADMIN);
    const { id } = await context.params;
    const input = adminWalletTransferReviewSchema.parse(await request.json());
    const transfer = await WalletTransferService.reviewTransfer(
      id,
      input.status as WalletTransferStatus,
    );

    return NextResponse.json({ transfer });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid transfer review input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "TRANSFER_NOT_FOUND") {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "TRANSFER_ALREADY_REVIEWED") {
      return NextResponse.json({ error: "Transfer has already been reviewed" }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to review transfer" }, { status: 500 });
  }
}
