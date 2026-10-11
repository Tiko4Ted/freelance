import { KycReviewStatus, Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { KycReviewActions } from "@/components/admin/kyc-review-actions";
import { requireRole } from "@/lib/auth/session";
import { AdminKycService } from "@/lib/services/admin-kyc-service";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

export default async function AdminKycPage() {
  try {
    await requireRole(Role.ADMIN);
  } catch {
    redirect("/login");
  }

  const reviews = await AdminKycService.listReviews();
  const pendingCount = reviews.filter(
    (review) => review.kycReviewStatus === KycReviewStatus.PENDING,
  ).length;

  return (
    <main className="min-h-screen bg-brand-canvas pt-[72px] text-brand-ink lg:pl-64">
      <section className="border-b border-brand-sand bg-brand-ivory">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-brand-gold-strong hover:underline" href="/admin">
            Admin
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
            Approval type · KYC
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">KYC approval</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
            Review identity submissions separately from project status and fund transfers. {pendingCount} pending review{pendingCount === 1 ? "" : "s"}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-8">
        <div className="divide-y divide-brand-sand overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
          {reviews.length ? reviews.map((review) => (
            <article className="grid min-w-0 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)] md:p-6" key={review.userId}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold">{review.name}</h2>
                  <span className="rounded-full bg-brand-canvas px-2.5 py-1 text-xs font-semibold text-brand-muted">
                    {review.kycReviewStatus}
                  </span>
                </div>
                <p className="mt-2 break-all text-sm text-brand-muted">{review.email}</p>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Legal name</dt>
                    <dd className="mt-1 font-medium">{review.identityLegalName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Date of birth</dt>
                    <dd className="mt-1 font-medium">{review.identityDateOfBirth ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Document type</dt>
                    <dd className="mt-1 font-medium">{review.identityDocumentType ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-muted">Identity submitted</dt>
                    <dd className="mt-1 font-medium">{formatDate(review.identityVerifiedAt)}</dd>
                  </div>
                </dl>
                {review.kycReviewNote ? <p className="mt-4 break-words whitespace-pre-wrap text-sm text-brand-muted">Note: {review.kycReviewNote}</p> : null}
              </div>
              <div className="min-w-0 rounded-xl border border-brand-sand bg-brand-canvas/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-gold-strong">KYC only</p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">Approving this review does not approve a project application or a fund transfer.</p>
                <div className="mt-4"><KycReviewActions status={review.kycReviewStatus} userId={review.userId} /></div>
              </div>
            </article>
          )) : <p className="p-5 text-sm text-brand-muted">No identity submissions are ready for review.</p>}
        </div>
      </section>
    </main>
  );
}
