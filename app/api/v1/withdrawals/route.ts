import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import { WithdrawalService } from "@/lib/services/withdrawal-service";
import { withdrawalRequestSchema } from "@/lib/validation/withdrawal";

export async function GET() {
  try {
    const session = await requireSession();
    const withdrawals = await WithdrawalService.listWithdrawals(session.user.id);

    return NextResponse.json({ withdrawals });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const input = withdrawalRequestSchema.parse(body);
    const withdrawal = await WithdrawalService.requestWithdrawal(
      session.user.id,
      input,
    );

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid withdrawal input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "WITHDRAWAL_BELOW_MINIMUM") {
      return NextResponse.json(
        { error: "Minimum withdrawal is $10" },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INSUFFICIENT_BALANCE_OR_PAYOUT_NOT_READY"
    ) {
      return NextResponse.json(
        { error: "Insufficient balance or payout account is not ready" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to request withdrawal" },
      { status: 500 },
    );
  }
}
