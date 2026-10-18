import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { PortalSidebar } from "@/components/portal-sidebar";
import { StatusBadge } from "@/components/status-badge";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";
import { requireSession } from "@/lib/auth/session";
import { LedgerService } from "@/lib/services/ledger-service";
import { WithdrawalService } from "@/lib/services/withdrawal-service";

export const dynamic = "force-dynamic";

function formatCents(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(amountCents / 100);
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Recent activity";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatRecordLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getWalletPulse(wallet: Awaited<ReturnType<typeof LedgerService.getWallet>>) {
  if (wallet.fundingBalanceCents > 0) {
    return {
      badge: "Ready for payout",
      description:
        "Your Funding wallet has a balance. Open Transfer funds when you are ready to choose a payout method.",
      tone: "positive",
    } as const;
  }

  if (wallet.holdingBalanceCents > 0) {
    return {
      badge: "Spot balance available",
      description:
        "Approved funds are in Spot. Move them into Funding before requesting a payout.",
      tone: "positive",
    } as const;
  }

  if (wallet.earnedAmountCents > 0) {
    return {
      badge: "Paid balance recorded",
      description:
        "Your approved earnings are recorded here. Available funds will appear in Spot before moving to Funding.",
      tone: "warm",
    } as const;
  }

  return {
    badge: "Wallet ready when you are",
    description:
      "Approved earnings appear in Spot first, then move into Funding before payout.",
    tone: "warm",
  } as const;
}

export default async function WalletPage() {
  let userId: string;
  let userName: string;

  try {
    const session = await requireSession();
    if (session.user.role === Role.ADMIN) {
      redirect("/admin");
    }
    userId = session.user.id;
    userName = session.user.name || "Teddy";
  } catch {
    redirect("/login");
  }

  const [wallet, withdrawals] = await Promise.all([
    LedgerService.getWallet(userId),
    WithdrawalService.listWithdrawals(userId),
  ]);
  const pulse = getWalletPulse(wallet);
  const latestLedgerEntry = wallet.ledgerEntries[0];
  const latestWithdrawal = withdrawals[0];
  const pulseSurface =
    pulse.tone === "positive"
      ? "border-emerald-200 bg-emerald-50/75"
      : "border-brand-gold/40 bg-[var(--color-accent-soft)]";
  const pulseText =
    pulse.tone === "positive" ? "text-emerald-800" : "text-brand-gold-strong";

  return (
    <div className="flex min-h-[100dvh] bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="payments"
        isAuthenticated
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-4 pb-10 pt-[92px] md:px-8 md:pt-[92px] lg:pl-64">
        <div className="mx-auto max-w-[1120px] space-y-4">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-sand/80 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Payments
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-brand-ink sm:text-3xl">
                Your wallet
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-brand-muted">
                See your Spot balance, Funding balance, and next transfer at a glance.
              </p>
            </div>
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-brand-sand bg-brand-ivory px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[var(--color-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              href="/home"
            >
              Back to home
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </header>

          <section
            aria-labelledby="wallet-overview-title"
            className="grid gap-3 lg:grid-cols-2"
          >
            <article
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-brand-card sm:p-6 ${pulseSurface}`}
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/60 bg-white/20 blur-2xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className={`h-4 w-4 ${pulseText}`}
                    />
                    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${pulseText}`}>
                      Spot wallet
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">
                    Source wallet
                  </span>
                </div>
                <h2
                  className="mt-5 text-[clamp(2.25rem,6vw,4rem)] font-bold leading-none tracking-[-0.07em] text-brand-ink"
                  id="wallet-overview-title"
                >
                  {wallet.formattedHoldingBalance}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-brand-muted">
                  Approved funds available to move into your Funding wallet.
                </p>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-brand-ink/10 pt-4">
                  <div>
                    <p className="mt-1 max-w-md text-xs leading-5 text-brand-ink/75">
                      {pulse.description}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${pulseText}`}>
                    {pulse.badge}
                  </span>
                </div>
              </div>
            </article>

            <article
              className={`rounded-2xl border p-5 shadow-brand-card sm:p-6 ${wallet.fundingBalanceCents > 0 ? "border-emerald-200 bg-emerald-50/75" : "border-brand-sand bg-brand-ivory"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <WalletCards
                    aria-hidden="true"
                    className={wallet.fundingBalanceCents > 0 ? "h-4 w-4 text-emerald-800" : "h-4 w-4 text-brand-muted"}
                  />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-muted">
                    Funding wallet
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">
                  Payout wallet
                </span>
              </div>
              <p className={`mt-5 text-[clamp(2.25rem,6vw,4rem)] font-bold leading-none tracking-[-0.07em] ${wallet.fundingBalanceCents > 0 ? "text-emerald-800" : "text-brand-ink"}`}>
                {wallet.formattedFundingBalance}
              </p>
              <p className="mt-3 max-w-md text-sm leading-6 text-brand-muted">
                Funds ready for a payout request once the $10 minimum is met.
              </p>
              <div className="mt-6 flex items-center gap-2 border-t border-brand-ink/10 pt-4 text-xs font-semibold text-brand-muted">
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Transfer from Spot to make funds available here.</span>
              </div>
            </article>
          </section>

          <section
            className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card sm:p-6"
            id="move-and-withdraw"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-brand-gold-strong">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">
                    Transfer between wallets
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-brand-ink">
                    Move from Spot to Funding
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-muted">
                    Transfer approved funds from Spot into Funding, then request a payout using your chosen method.
                  </p>
                </div>
              </div>
              <div className="grid min-w-[13rem] gap-2 text-xs sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-sand/80 bg-brand-canvas/55 px-3 py-2.5">
                  <span className="font-medium text-brand-muted">Spot wallet</span>
                  <span className="font-semibold text-brand-ink">{wallet.formattedHoldingBalance}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-sand/80 bg-brand-canvas/55 px-3 py-2.5">
                  <span className="font-medium text-brand-muted">Funding wallet</span>
                  <span className={wallet.fundingBalanceCents > 0 ? "font-semibold text-emerald-800" : "font-semibold text-brand-ink"}>
                    {wallet.formattedFundingBalance}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-brand-sand/70 pt-4">
              <WithdrawalForm
                fundingBalanceCents={wallet.fundingBalanceCents}
                holdingBalanceCents={wallet.holdingBalanceCents}
                isFreelanceVerified={Boolean(wallet.freelanceVerification)}
              />
            </div>
          </section>

          <section
            aria-label="Payment activity summary"
            className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
            id="wallet-records"
          >
            <article className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-brand-gold-strong">
                    <FileText aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-brand-ink">Latest payment activity</h2>
                    <p className="mt-1 text-xs leading-5 text-brand-muted">
                      A quick view of the record behind your balance.
                    </p>
                  </div>
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  href="#ledger-history"
                >
                  Open ledger
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="mt-5 rounded-xl border border-brand-sand/80 bg-brand-canvas/55 p-4">
                {latestLedgerEntry ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">
                        Latest record
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-brand-ink">
                        {formatRecordLabel(latestLedgerEntry.reason)}
                      </p>
                      <p className="mt-1 text-xs text-brand-muted">
                        {latestLedgerEntry.account} account, {formatShortDate(latestLedgerEntry.createdAt)}
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${latestLedgerEntry.amountCents >= 0 ? "text-emerald-800" : "text-brand-ink"}`}>
                      {latestLedgerEntry.amountCents >= 0 ? "+" : ""}
                      {latestLedgerEntry.formattedAmount}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-brand-muted">
                    Your first approved payment will create the first record here.
                  </p>
                )}
              </div>

              <p className="mt-4 text-xs font-medium text-brand-muted">
                {wallet.ledgerEntries.length} {wallet.ledgerEntries.length === 1 ? "ledger entry" : "ledger entries"}
                {wallet.transfers.length ? `, ${wallet.transfers.length} ${wallet.transfers.length === 1 ? "transfer" : "transfers"}` : ""}
              </p>
            </article>

            <article className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-ink">Withdrawal status</h2>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">
                    See what happened after a payout request.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-brand-sand/80 bg-brand-canvas/55 p-4">
                {latestWithdrawal ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <StatusBadge status={latestWithdrawal.status} />
                      <p className="mt-2 text-xs text-brand-muted">
                        {formatShortDate(latestWithdrawal.requestedAt)}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-brand-ink">
                      {formatCents(latestWithdrawal.amountCents)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-brand-muted">
                    No payout requests yet. Your Funding wallet is ready when you are.
                  </p>
                )}
              </div>
              <a
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                href="#withdrawals"
              >
                View withdrawal history
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <section className="flex min-h-0 flex-col gap-2" id="ledger-history" aria-labelledby="ledger-history-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-brand-ink" id="ledger-history-title">
                    Ledger history
                  </h2>
                  <p className="mt-1 text-xs text-brand-muted">Every balance movement in one place.</p>
                </div>
                <span className="text-xs font-semibold text-brand-muted">{wallet.ledgerEntries.length} records</span>
              </div>
              <div className="max-h-[30rem] divide-y divide-brand-sand overflow-y-auto rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
                {wallet.ledgerEntries.length ? (
                  wallet.ledgerEntries.map((entry) => (
                    <article
                      className="grid gap-2 p-4 transition hover:bg-brand-canvas/60 md:grid-cols-[1fr_auto]"
                      key={entry.id}
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-brand-ink">
                          {formatRecordLabel(entry.reason)}
                        </h3>
                        <p className="mt-1 truncate text-xs text-brand-muted">
                          {entry.account} account, {formatShortDate(entry.createdAt)}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${entry.amountCents >= 0 ? "text-emerald-800" : "text-brand-ink"}`}>
                        {entry.amountCents >= 0 ? "+" : ""}
                        {entry.formattedAmount}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="p-5 text-center text-sm text-brand-muted">
                    No ledger entries yet. Your first approved payment will appear here.
                  </p>
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col gap-2" id="withdrawals" aria-labelledby="withdrawals-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-brand-ink" id="withdrawals-title">
                    Withdrawal history
                  </h2>
                  <p className="mt-1 text-xs text-brand-muted">Track each request after payout.</p>
                </div>
                <span className="text-xs font-semibold text-brand-muted">{withdrawals.length} requests</span>
              </div>
              <div className="max-h-[30rem] divide-y divide-brand-sand overflow-y-auto rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
                {withdrawals.length ? (
                  withdrawals.map((withdrawal) => (
                    <article
                      className="grid gap-2 p-4 transition hover:bg-brand-canvas/60 md:grid-cols-[1fr_auto]"
                      key={withdrawal.id}
                    >
                      <div>
                        <StatusBadge status={withdrawal.status} />
                        <p className="mt-2 text-xs text-brand-muted">
                          {formatShortDate(withdrawal.requestedAt)}
                        </p>
                        {withdrawal.payoutMethod ? (
                          <p className="mt-0.5 text-[11px] font-medium text-brand-muted">
                            {withdrawal.payoutMethod}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-bold text-brand-ink">
                        {formatCents(withdrawal.amountCents)}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="p-5 text-center text-sm text-brand-muted">
                    No withdrawals yet. Requests will appear here after you submit one.
                  </p>
                )}
              </div>
            </section>
          </section>

          {latestWithdrawal ? (
            <p className="flex items-center gap-2 border-t border-brand-sand/70 pt-4 text-xs text-brand-muted">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              Latest withdrawal request: {formatCents(latestWithdrawal.amountCents)} on {formatShortDate(latestWithdrawal.requestedAt)}.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
