import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { JobCreateForm } from "@/components/admin/job-create-form";
import { HomeProjectToggle } from "@/components/admin/home-project-toggle";
import { requireRole } from "@/lib/auth/session";
import { AdminJobService } from "@/lib/services/admin-job-service";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  try {
    await requireRole(Role.ADMIN);
  } catch {
    redirect("/login");
  }

  const jobs = await AdminJobService.listJobs();

  return (
    <main className="min-h-screen bg-brand-canvas text-brand-ink">
      <section className="border-b border-brand-sand bg-brand-ivory">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link
            className="text-sm font-medium text-brand-gold-strong hover:underline"
            href="/admin"
          >
            Admin
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-brand-ink md:text-5xl">
            Jobs
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_24rem] md:px-8">
        <div className="divide-y divide-brand-sand overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
          {jobs.map((job) => (
            <article className="p-5" key={job.id}>
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <h2 className="font-semibold text-brand-ink">{job.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">
                    {job.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-brand-muted">
                    {job.openings} participant{" "}
                    {job.openings === 1 ? "spot" : "spots"} remaining
                  </p>
                  <HomeProjectToggle
                    jobId={job.id}
                    openings={job.openings}
                    showOnHome={job.showOnHome}
                  />
                </div>
                <p className="text-sm font-semibold text-brand-gold-strong">
                  {job.isActive ? "ACTIVE" : "INACTIVE"}
                </p>
              </div>
            </article>
          ))}
        </div>
        <aside className="h-fit rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
          <h2 className="text-xl font-semibold text-brand-ink">Create job</h2>
          <div className="mt-5">
            <JobCreateForm />
          </div>
        </aside>
      </section>
    </main>
  );
}
