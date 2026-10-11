import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TransferReviewActions } from "@/components/admin/transfer-review-actions";
import { requireRole } from "@/lib/auth/session";
import { WalletTransferService } from "@/lib/services/wallet-transfer-service";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminTransfersPage() {
  try {
    await requireRole(Role.ADMIN);
  } catch {
    redirect("/login");
  }

  const transfers = await WalletTransferService.listPendingTransfers();

  return (
    <main className="min-h-screen bg-brand-canvas pt-[72px] text-brand-ink lg:pl-64">
      <section className="border-b border-brand-sand bg-brand-ivory">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-brand-gold-strong hover:underline" href="/admin">
            Admin
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
            Approval type · Funds
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Fund transfer approval</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
            Review holding-to-funding requests separately from KYC and project status. Pending requests reserve the amount until approved or returned.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-8">
        <div className="divide-y divide-brand-sand overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
          {transfers.length ? transfers.map((transfer) => (
            <article className="grid min-w-0 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)] md:p-6" key={transfer.id}>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold">{transfer.user.name}</h2>
                  <span className="rounded-full bg-brand-canvas px-2.5 py-1 text-xs font-semibold text-brand-muted">PENDING</span>
                </div>
                <p className="mt-2 break-all text-sm text-brand-muted">{transfer.user.email}</p>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Amount</dt><dd className="mt-1 font-semibold">${(transfer.amountCents / 100).toFixed(2)}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Requested</dt><dd className="mt-1 font-medium">{formatDate(transfer.createdAt)}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Freelance ID</dt><dd className="mt-1 font-medium">{transfer.verification?.freelanceIdCode ?? "—"}</dd></div>
                </dl>
              </div>
              <div className="min-w-0 rounded-xl border border-brand-sand bg-brand-canvas/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-strong">Funds only</p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">This action credits Funding or returns the reserved amount to Holding. It does not approve KYC or a project.</p>
                <div className="mt-4"><TransferReviewActions transferId={transfer.id} /></div>
              </div>
            </article>
          )) : <p className="p-5 text-sm text-brand-muted">No fund transfers are waiting for approval.</p>}
        </div>
      </section>
    </main>
  );
}
