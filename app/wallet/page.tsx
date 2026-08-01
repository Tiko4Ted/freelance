import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";
import { requireSession } from "@/lib/auth/session";
import { LedgerService } from "@/lib/services/ledger-service";
import { WithdrawalService } from "@/lib/services/withdrawal-service";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  let userId: string;

  try {
    const session = await requireSession();
    userId = session.user.id;
  } catch {
    redirect("/login");
  }

  const [wallet, withdrawals] = await Promise.all([
    LedgerService.getWallet(userId),
    WithdrawalService.listWithdrawals(userId),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href="/dashboard">
            Dashboard
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Wallet
          </h1>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Holding</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {wallet.formattedHoldingBalance}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Completed job money waits here until freelance ID verification.
              </p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Funding</p>
              <p className="mt-2 text-3xl font-semibold text-teal-700">
                {wallet.formattedFundingBalance}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Funds here can be withdrawn to your selected payout method.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_22rem] md:px-8">
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {wallet.ledgerEntries.length ? (
            wallet.ledgerEntries.map((entry) => (
              <article
                className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
                key={entry.id}
              >
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {entry.reason}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {entry.account} - {entry.createdAt}
                  </p>
                </div>
                <p
                  className={
                    entry.amountCents >= 0
                      ? "font-semibold text-teal-700"
                      : "font-semibold text-red-700"
                  }
                >
                  {entry.formattedAmount}
                </p>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-slate-600">No ledger entries yet.</p>
          )}
        </div>
        <aside className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Move and withdraw
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Funding available: {wallet.formattedFundingBalance} - Minimum
            withdrawal: $10
          </p>
          <div className="mt-5">
            <WithdrawalForm
              fundingBalanceCents={wallet.fundingBalanceCents}
              holdingBalanceCents={wallet.holdingBalanceCents}
              isFreelanceVerified={Boolean(wallet.freelanceVerification)}
            />
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
        <h2 className="text-xl font-semibold text-slate-950">Withdrawals</h2>
        <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-white">
          {withdrawals.length ? (
            withdrawals.map((withdrawal) => (
              <article
                className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
                key={withdrawal.id}
              >
                <div>
                  <StatusBadge status={withdrawal.status} />
                  <p className="mt-2 text-sm text-slate-500">
                    {withdrawal.requestedAt}
                  </p>
                  {withdrawal.payoutMethod ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {withdrawal.payoutMethod}
                    </p>
                  ) : null}
                </div>
                <p className="font-semibold text-slate-950">
                  ${(withdrawal.amountCents / 100).toFixed(2)}
                </p>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-slate-600">No withdrawals yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
