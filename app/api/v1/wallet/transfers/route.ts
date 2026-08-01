import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import { WalletTransferService } from "@/lib/services/wallet-transfer-service";
import { walletTransferSchema } from "@/lib/validation/wallet-transfer";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const input = walletTransferSchema.parse(body);
    const wallet = await WalletTransferService.transferHoldingToFunding(
      session.user.id,
      input,
    );

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid transfer input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "FREELANCE_ID_REQUIRED") {
        return NextResponse.json(
          { error: "Freelance ID verification is required" },
          { status: 428 },
        );
      }

      if (error.message === "TRANSFER_AMOUNT_BELOW_MINIMUM") {
        return NextResponse.json(
          { error: "Minimum transfer amount is $10" },
          { status: 400 },
        );
      }

      if (error.message === "INVALID_FREELANCE_ID_DETAILS") {
        return NextResponse.json(
          { error: "Freelance ID or serial number does not match our records" },
          { status: 400 },
        );
      }

      if (error.message === "FREELANCE_ID_ALREADY_USED") {
        return NextResponse.json(
          { error: "This freelance ID has already been used" },
          { status: 409 },
        );
      }

      if (error.message === "INSUFFICIENT_HOLDING_BALANCE") {
        return NextResponse.json(
          { error: "Insufficient holding balance" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Unable to transfer funds" },
      { status: 500 },
    );
  }
}
