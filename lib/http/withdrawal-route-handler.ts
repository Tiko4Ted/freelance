import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { WithdrawalRequestInput } from "@/lib/validation/withdrawal";
import { withdrawalRequestSchema } from "@/lib/validation/withdrawal";

type WithdrawalSession = {
  user: {
    id: string;
  };
};

type WithdrawalRouteDependencies = {
  requireSession: () => Promise<WithdrawalSession>;
  listWithdrawals: (userId: string) => Promise<unknown>;
  requestWithdrawal: (
    userId: string,
    input: WithdrawalRequestInput,
  ) => Promise<unknown>;
};

export function createWithdrawalHandlers(
  dependencies: WithdrawalRouteDependencies,
) {
  return {
    async GET() {
      try {
        const session = await dependencies.requireSession();
        const withdrawals = await dependencies.listWithdrawals(session.user.id);

        return NextResponse.json({ withdrawals });
      } catch {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
    },

    async POST(request: Request) {
      try {
        const session = await dependencies.requireSession();
        const body: unknown = await request.json();
        const input = withdrawalRequestSchema.parse(body);
        const withdrawal = await dependencies.requestWithdrawal(
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

        if (
          error instanceof Error &&
          error.message === "WITHDRAWAL_BELOW_MINIMUM"
        ) {
          return NextResponse.json(
            { error: "Minimum withdrawal is $10" },
            { status: 400 },
          );
        }

        if (
          error instanceof Error &&
          error.message === "INSUFFICIENT_FUNDING_BALANCE"
        ) {
          return NextResponse.json(
            { error: "Insufficient funding balance" },
            { status: 409 },
          );
        }

        if (
          error instanceof Error &&
          error.message === "PAYOUT_ACCOUNT_NOT_READY"
        ) {
          return NextResponse.json(
            { error: "Set up a payout account before withdrawing" },
            { status: 409 },
          );
        }

        return NextResponse.json(
          { error: "Unable to request withdrawal" },
          { status: 500 },
        );
      }
    },
  };
}
