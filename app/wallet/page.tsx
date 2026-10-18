import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
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
      badge: "Ready for the next step",
      title: "Your funding balance is ready to move.",
      description:
        "Your funds are available in Funding. Review the trail below, then request a withdrawal when your payout details are ready.",
      tone: "positive",
    } as const;
  }

  if (wallet.holdingBalanceCents > 0) {
    return {
      badge: "Payment progress",
      title: "Your completed work is moving forward.",
      description:
        "Approved earnings are in Holding. They stay here until your wallet is cleared for transfer.",
      tone: "positive",
    } as const;
  }

  if (wallet.earnedAmountCents > 0) {
    return {
      badge: "Wallet record growing",
      title: "Your work has started to add up.",
      description:
        "Approved earnings are recorded here. The next wallet movement will appear in your payment trail below.",
      tone: "warm",
    } as const;
  }

  return {
    badge: "Wallet ready when you are",
    title: "Your payment story starts here.",
    description:
      "Approved work, transfers, and withdrawals will collect here so you can follow every step without guessing.",
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
  const hasPositiveBalance =
    wallet.earnedAmountCents > 0 ||
    wallet.holdingBalanceCents > 0 ||
    wallet.fundingBalanceCents > 0;
  const pulseSurface =
    pulse.tone === "positive"
      ? "border-emerald-200 bg-emerald-50/80"
      : "border-brand-gold/40 bg-[var(--color-accent-soft)]";
  const pulseText =
    pulse.tone === "positive" ? "text-emerald-800" : "text-brand-gold-strong";
  const balanceCards = [
    {
      label: "Earned",
      value: wallet.formattedEarnedAmount,
      note: "Approved project payouts recorded here.",
      status: wallet.earnedAmountCents > 0 ? "Recorded" : "Waiting for your first payout",
      className: "border-brand-gold/50 bg-[var(--color-accent-soft)]",
      valueClassName: "text-brand-gold-strong",
    },
    {
      label: "Holding",
      value: wallet.formattedHoldingBalance,
      note: "Completed work waiting for wallet transfer.",
      status: wallet.holdingBalanceCents > 0 ? "Moving forward" : "No balance yet",
      className: "border-brand-sand bg-brand-ivory",
      valueClassName: "text-brand-ink",
    },
    {
      label: "Funding",
      value: wallet.formattedFundingBalance,
      note: "Available balance toward a withdrawal request.",
      status: wallet.fundingBalanceCents > 0 ? "Balance available" : "Builds after transfer",
      className:
        wallet.fundingBalanceCents > 0
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-brand-sand bg-brand-ivory",
      valueClassName:
        wallet.fundingBalanceCents > 0
          ? "text-emerald-800"
          : "text-brand-ink",
    },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="payments"
        isAuthenticated
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-[92px] md:px-8 md:pt-[92px] lg:pl-64">
        <div className="mx-auto max-w-[1120px] space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-sand/80 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Payments
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-brand-ink sm:text-3xl">
                Your wallet
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-brand-muted">
                Follow what you have earned, what is moving, and what can take the next step.
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

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]" aria-labelledby="wallet-pulse-title">
            <article
              className={`relative overflow-hidden rounded-2xl border p-5 shadow-brand-card sm:p-6 ${pulseSurface}`}
            >
              <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/60 bg-white/20 blur-2xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] ${pulseText}`}>
                    {pulse.tone === "positive" ? (
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <WalletCards aria-hidden="true" className="h-4 w-4" />
                    )}
                    {pulse.badge}
                  </span>
                </div>
                <h2 id="wallet-pulse-title" className="mt-4 max-w-xl text-2xl font-bold tracking-[-0.03em] text-brand-ink sm:text-[30px]">
                  {pulse.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">
                  {pulse.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                    href="#move-and-withdraw"
                  >
                    Move funds
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                  <a
                    className="inline-flex h-10 items-center rounded-[10px] border border-brand-ink/20 bg-brand-ivory/70 px-4 text-sm font-semibold text-brand-ink transition hover:border-brand-ink/40 hover:bg-brand-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                    href="#wallet-records"
                  >
                    Review records
                  </a>
                </div>
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {balanceCards.map((card) => (
                <article
                  className={`rounded-2xl border p-4 shadow-brand-card ${card.className}`}
                  key={card.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-brand-muted">{card.label}</p>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">
                      {card.status}
                    </span>
                  </div>
                  <p className={`mt-2 text-[26px] font-bold tracking-tight ${card.valueClassName}`}>
                    {card.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-brand-muted">
                    {card.note}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
            id="wallet-records"
            aria-label="Wallet records and reporting"
          >
            <article className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-brand-gold-strong">
                    <FileText aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-brand-ink">Reports and receipts</h2>
                    <p className="mt-1 text-xs leading-5 text-brand-muted">
                      The wallet history behind your payment summaries and receipt questions.
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
                    <p
                      className={`text-lg font-bold ${latestLedgerEntry.amountCents >= 0 ? "text-emerald-800" : "text-brand-ink"}`}
                    >
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-brand-muted">
                  {wallet.ledgerEntries.length} {wallet.ledgerEntries.length === 1 ? "ledger entry" : "ledger entries"}
                  {wallet.transfers.length ? `, ${wallet.transfers.length} wallet ${wallet.transfers.length === 1 ? "transfer" : "transfers"}` : ""}
                </span>
                <Link
                  className="font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  href="/help-center"
                >
                  Need payment help?
                </Link>
              </div>
            </article>

            <article className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                  <BarChart3 aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-ink">Movement at a glance</h2>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">
                    A small reporting view of the money moving through your wallet.
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-brand-sand/80 bg-brand-canvas/55 p-3">
                  <dt className="text-[11px] font-semibold text-brand-muted">Transfers</dt>
                  <dd className="mt-1 text-xl font-bold text-brand-ink">{wallet.transfers.length}</dd>
                  <dd className="mt-1 text-[11px] text-brand-muted">Holding to Funding</dd>
                </div>
                <div className="rounded-xl border border-brand-sand/80 bg-brand-canvas/55 p-3">
                  <dt className="text-[11px] font-semibold text-brand-muted">Withdrawals</dt>
                  <dd className="mt-1 text-xl font-bold text-brand-ink">{withdrawals.length}</dd>
                  <dd className="mt-1 text-[11px] text-brand-muted">Payout requests</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-brand-sand px-3 py-2 text-xs font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[var(--color-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  href="#withdrawals"
                >
                  View withdrawal trail
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid gap-4 xl:grid-cols-2">
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
                        <p
                          className={`text-sm font-semibold ${entry.amountCents >= 0 ? "text-emerald-800" : "text-brand-ink"}`}
                        >
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
                      Withdrawal trail
                    </h2>
                    <p className="mt-1 text-xs text-brand-muted">Track each request after it leaves Funding.</p>
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
                      No withdrawals yet. When Funding is ready, your requests will be tracked here.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside
              className="h-fit rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card sm:p-6"
              id="move-and-withdraw"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-brand-gold-strong">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-brand-ink">Move and withdraw</h2>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">
                    Move approved earnings to Funding, then request a payout when your details are ready.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-sand/80 bg-brand-canvas/55 px-3 py-2.5">
                  <span className="font-medium text-brand-muted">Holding</span>
                  <span className="font-semibold text-brand-ink">{wallet.formattedHoldingBalance}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-sand/80 bg-brand-canvas/55 px-3 py-2.5">
                  <span className="font-medium text-brand-muted">Funding</span>
                  <span className={hasPositiveBalance && wallet.fundingBalanceCents > 0 ? "font-semibold text-emerald-800" : "font-semibold text-brand-ink"}>
                    {wallet.formattedFundingBalance}
                  </span>
                </div>
              </div>
              <div className="mt-4 border-t border-brand-sand/70 pt-4">
                <p className="text-xs leading-5 text-brand-muted">
                  Minimum withdrawal: <span className="font-semibold text-brand-ink">$10</span>
                </p>
                <div className="mt-4">
                  <WithdrawalForm
                    fundingBalanceCents={wallet.fundingBalanceCents}
                    holdingBalanceCents={wallet.holdingBalanceCents}
                    isFreelanceVerified={Boolean(wallet.freelanceVerification)}
                  />
                </div>
              </div>
            </aside>
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
