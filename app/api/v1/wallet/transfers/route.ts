import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requestContextFromHeaders } from "@/lib/audit/request-context";
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
      requestContextFromHeaders(request.headers),
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
          { error: "Freelance identity details do not match our records" },
          { status: 400 },
        );
      }

      if (error.message === "IDENTITY_VERIFICATION_LOCKED") {
        return NextResponse.json(
          { error: "Too many failed identity verification attempts" },
          { status: 429 },
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
