import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";
import { requireSession } from "@/lib/auth/session";
import { LedgerService } from "@/lib/services/ledger-service";
import { PayoutAccountService } from "@/lib/services/payout-account-service";
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

  const [wallet, withdrawals, payoutAccount] = await Promise.all([
    LedgerService.getWallet(userId),
    WithdrawalService.listWithdrawals(userId),
    PayoutAccountService.getStatus(userId),
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
          <p className="mt-4 text-4xl font-semibold text-teal-700">
            {wallet.formattedBalance}
          </p>
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
                    {entry.createdAt}
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
          <h2 className="text-xl font-semibold text-slate-950">Withdraw</h2>
          <p className="mt-2 text-sm text-slate-600">
            Available: {wallet.formattedBalance} · Minimum withdrawal: $10
          </p>
          <p className="mt-2 text-sm font-medium">
            Payout account:{" "}
            <span
              className={
                payoutAccount.payoutAccountReady
                  ? "text-teal-700"
                  : "text-amber-700"
              }
            >
              {payoutAccount.payoutAccountReady ? "Ready" : "Not set up"}
            </span>
          </p>
          <div className="mt-5">
            <WithdrawalForm payoutAccountReady={payoutAccount.payoutAccountReady} />
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
