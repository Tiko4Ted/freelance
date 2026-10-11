import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { AdminApplicationService } from "@/lib/services/admin-application-service";
import { AdminKycService } from "@/lib/services/admin-kyc-service";
import { AdminJobService } from "@/lib/services/admin-job-service";
import { WalletTransferService } from "@/lib/services/wallet-transfer-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireRole(Role.ADMIN);
  } catch {
    redirect("/login");
  }

  const [jobs, applications, kycReviews, transfers] = await Promise.all([
    AdminJobService.listJobs(),
    AdminApplicationService.listApplications(),
    AdminKycService.listReviews(),
    WalletTransferService.listPendingTransfers(),
  ]);

  return (
    <>
      <main className="min-h-screen bg-brand-canvas pt-[72px] text-brand-ink lg:pl-64">
      <section className="border-b border-brand-sand bg-brand-ivory">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link aria-label="Trinity-AI operations" href="/admin">
            Trinity-AI
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
            Operations
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-brand-ink md:text-5xl">
            Admin
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2 md:px-8">
        <Link
          className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card transition hover:border-brand-gold"
          href="/admin/jobs"
        >
          <p className="text-sm font-medium text-brand-muted">Jobs</p>
          <p className="mt-3 text-4xl font-semibold text-brand-gold-strong">
            {jobs.length}
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card transition hover:border-brand-gold"
          href="/admin/kyc"
        >
          <p className="text-sm font-medium text-brand-muted">KYC approval</p>
          <p className="mt-3 text-4xl font-semibold text-brand-gold-strong">
            {kycReviews.filter((review) => review.kycReviewStatus === "PENDING").length}
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card transition hover:border-brand-gold"
          href="/admin/transfers"
        >
          <p className="text-sm font-medium text-brand-muted">Fund transfers</p>
          <p className="mt-3 text-4xl font-semibold text-brand-gold-strong">
            {transfers.length}
          </p>
        </Link>
        <Link
          className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card transition hover:border-brand-gold"
          href="/admin/applications"
        >
          <p className="text-sm font-medium text-brand-muted">Applications</p>
          <p className="mt-3 text-4xl font-semibold text-brand-gold-strong">
            {applications.length}
          </p>
        </Link>
      </section>
      </main>
    </>
  );
}
