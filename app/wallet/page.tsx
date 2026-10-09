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
    <div className="flex min-h-[100dvh] bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="payments"
        isAuthenticated
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-[88px] md:h-[calc(100dvh-72px)] md:min-h-0 md:overflow-hidden md:px-8 md:pb-4 md:pt-[84px] lg:pl-64">
        <div className="mx-auto flex h-full min-h-0 max-w-[1120px] flex-col gap-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-brand-ink md:text-[28px]">
              Wallet
            </h1>
          </div>

          <div className="grid shrink-0 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-brand-gold/50 bg-[#f2e8d7] p-4 shadow-brand-card">
              <p className="text-xs font-medium text-brand-muted">
                Amount earned
              </p>
              <p className="mt-1 text-[26px] font-bold tracking-tight text-brand-gold-strong">
                {wallet.formattedEarnedAmount}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-brand-muted">
                Total approved project payouts recorded in your wallet.
              </p>
            </div>
            <div className="rounded-xl border border-brand-sand bg-brand-ivory p-4 shadow-brand-card">
              <p className="text-xs font-medium text-brand-muted">Holding</p>
              <p className="mt-1 text-[26px] font-bold tracking-tight text-brand-ink">
                {wallet.formattedHoldingBalance}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-brand-muted">
                Completed job money waits here until freelance ID verification.
              </p>
            </div>
            <div className="rounded-xl border border-brand-gold/50 bg-[#f2e8d7] p-4 shadow-brand-card">
              <p className="text-xs font-medium text-brand-muted">Funding</p>
              <p className="mt-1 text-[26px] font-bold tracking-tight text-brand-gold-strong">
                {wallet.formattedFundingBalance}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-brand-muted">
                Funds here can be withdrawn to your selected payout method.
              </p>
            </div>
          </div>

          <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid min-h-0 gap-4 lg:grid-rows-2 xl:grid-cols-2 xl:grid-rows-1">
              <div className="flex min-h-0 flex-col gap-2">
                <h2 className="shrink-0 text-base font-bold text-brand-ink">
                  Ledger History
                </h2>
                <div className="min-h-0 flex-1 divide-y divide-brand-sand overflow-y-auto rounded-xl border border-brand-sand bg-brand-ivory shadow-brand-card">
                  {wallet.ledgerEntries.length ? (
                    wallet.ledgerEntries.map((entry) => (
                      <article
                        className="grid gap-2 p-3 transition hover:bg-brand-canvas/60 md:grid-cols-[1fr_auto]"
                        key={entry.id}
                      >
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-brand-ink">
                            {entry.reason}
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-brand-muted">
                            {entry.account} - {entry.createdAt}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            entry.amountCents >= 0
                              ? "text-brand-gold-strong"
                              : "text-brand-ink"
                          }`}
                        >
                          {entry.formattedAmount}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="p-4 text-center text-xs text-brand-muted">
                      No ledger entries yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-col gap-2">
                <h2 className="shrink-0 text-base font-bold text-brand-ink">
                  Withdrawals
                </h2>
                <div className="min-h-0 flex-1 divide-y divide-brand-sand overflow-y-auto rounded-xl border border-brand-sand bg-brand-ivory shadow-brand-card">
                  {withdrawals.length ? (
                    withdrawals.map((withdrawal) => (
                      <article
                        className="grid gap-2 p-3 transition hover:bg-brand-canvas/60 md:grid-cols-[1fr_auto]"
                        key={withdrawal.id}
                      >
                        <div>
                          <StatusBadge status={withdrawal.status} />
                          <p className="mt-1 text-xs text-brand-muted">
                            {withdrawal.requestedAt}
                          </p>
                          {withdrawal.payoutMethod ? (
                            <p className="mt-0.5 text-[11px] font-medium text-brand-muted">
                              {withdrawal.payoutMethod}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-sm font-bold text-brand-ink">
                          ${(withdrawal.amountCents / 100).toFixed(2)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="p-4 text-center text-xs text-brand-muted">
                      No withdrawals yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-xl border border-brand-sand bg-brand-ivory p-4 shadow-brand-card">
              <h2 className="text-base font-bold text-brand-ink">
                Move and withdraw
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                Funding: {" "}
                <span className="font-medium text-brand-ink">
                  {wallet.formattedFundingBalance}
                </span>
                <span className="px-1">·</span>
                Minimum: {" "}
                <span className="font-medium text-brand-ink">$10</span>
              </p>
              <div className="mt-4">
                <WithdrawalForm
                  fundingBalanceCents={wallet.fundingBalanceCents}
                  holdingBalanceCents={wallet.holdingBalanceCents}
                  isFreelanceVerified={Boolean(wallet.freelanceVerification)}
                />
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
