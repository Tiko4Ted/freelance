import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { requireRole } from "@/lib/auth/session";
import { AdminApplicationService } from "@/lib/services/admin-application-service";
import { AdminJobService } from "@/lib/services/admin-job-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  try {
    await requireRole(Role.ADMIN);
  } catch {
    redirect("/login");
  }

  const [jobs, applications] = await Promise.all([
    AdminJobService.listJobs(),
    AdminApplicationService.listApplications(),
  ]);

  return (
    <main className="min-h-screen bg-brand-canvas text-brand-ink">
      <section className="border-b border-brand-sand bg-brand-ivory">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link aria-label="Trinity-AI home" href="/">
            <BrandLogo
              imageClassName="h-11 w-11 shadow-sm"
              nameClassName="text-sm font-semibold text-brand-ink"
              showName
            />
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
          href="/admin/applications"
        >
          <p className="text-sm font-medium text-brand-muted">Applications</p>
          <p className="mt-3 text-4xl font-semibold text-brand-gold-strong">
            {applications.length}
          </p>
        </Link>
      </section>
    </main>
  );
}
