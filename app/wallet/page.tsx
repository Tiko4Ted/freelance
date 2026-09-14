import { redirect } from "next/navigation";

import { PortalSidebar } from "@/components/portal-sidebar";
import { StatusBadge } from "@/components/status-badge";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";
import { requireSession } from "@/lib/auth/session";
import { LedgerService } from "@/lib/services/ledger-service";
import { WithdrawalService } from "@/lib/services/withdrawal-service";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  let userId: string;
  let userName: string;

  try {
    const session = await requireSession();
    userId = session.user.id;
    userName = session.user.name || "Teddy";
  } catch {
    redirect("/login");
  }

  const [wallet, withdrawals] = await Promise.all([
    LedgerService.getWallet(userId),
    WithdrawalService.listWithdrawals(userId),
  ]);

  return (
    <div className="flex min-h-screen bg-[#fafafc] text-slate-900">
      <PortalSidebar
        activeTab="payments"
        userName={userName}
        avatarColor="#c2410c"
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px] space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[34px]">
              Wallet
            </h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Holding</p>
              <p className="mt-2 text-[32px] font-bold tracking-tight text-slate-900">
                {wallet.formattedHoldingBalance}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Completed job money waits here until freelance ID verification.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Funding</p>
              <p className="mt-2 text-[32px] font-bold tracking-tight text-blue-600">
                {wallet.formattedFundingBalance}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Funds here can be withdrawn to your selected payout method.
              </p>
            </div>
          </div>

          <section className="grid gap-8 md:grid-cols-[1fr_22rem]">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                Ledger History
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm divide-y divide-slate-200/60">
                {wallet.ledgerEntries.length ? (
                  wallet.ledgerEntries.map((entry) => (
                    <article
                      className="grid gap-3 p-5 transition hover:bg-slate-50 md:grid-cols-[1fr_auto]"
                      key={entry.id}
                    >
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {entry.reason}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.account} - {entry.createdAt}
                        </p>
                      </div>
                      <p
                        className={`font-semibold ${
                          entry.amountCents >= 0
                            ? "text-blue-600"
                            : "text-slate-900"
                        }`}
                      >
                        {entry.formattedAmount}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No ledger entries yet.
                  </p>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Move and withdraw
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Funding available:{" "}
                <span className="font-medium text-slate-700">
                  {wallet.formattedFundingBalance}
                </span>
                <br />
                Minimum withdrawal:{" "}
                <span className="font-medium text-slate-700">$10</span>
              </p>
              <div className="mt-6">
                <WithdrawalForm
                  fundingBalanceCents={wallet.fundingBalanceCents}
                  holdingBalanceCents={wallet.holdingBalanceCents}
                  isFreelanceVerified={Boolean(wallet.freelanceVerification)}
                />
              </div>
            </aside>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-slate-900">Withdrawals</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm divide-y divide-slate-200/60">
              {withdrawals.length ? (
                withdrawals.map((withdrawal) => (
                  <article
                    className="grid gap-3 p-5 transition hover:bg-slate-50 md:grid-cols-[1fr_auto]"
                    key={withdrawal.id}
                  >
                    <div>
                      <StatusBadge status={withdrawal.status} />
                      <p className="mt-2 text-sm text-slate-500">
                        {withdrawal.requestedAt}
                      </p>
                      {withdrawal.payoutMethod ? (
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {withdrawal.payoutMethod}
                        </p>
                      ) : null}
                    </div>
                    <p className="font-bold text-slate-900">
                      ${(withdrawal.amountCents / 100).toFixed(2)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="p-8 text-center text-sm text-slate-500">
                  No withdrawals yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
