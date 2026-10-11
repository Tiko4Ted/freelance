import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { JobCreateForm } from "@/components/admin/job-create-form";
import { HomeProjectToggle } from "@/components/admin/home-project-toggle";
import { ProjectLifecycleActions } from "@/components/admin/project-lifecycle-actions";
import { PortalSidebar } from "@/components/portal-sidebar";
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
    <>
      <PortalSidebar activeTab="home" isAuthenticated userName="Admin" />
      <main className="min-h-screen bg-brand-canvas pt-[72px] text-brand-ink lg:pl-64">
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
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-brand-ink">{job.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${
                        !job.isActive
                          ? "bg-slate-200 text-slate-700"
                          : job.showOnHome
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-brand-canvas text-brand-muted"
                      }`}
                    >
                      {!job.isActive
                        ? "CLOSED"
                        : job.showOnHome
                          ? "PUBLISHED"
                          : "UNPUBLISHED"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">
                    {job.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-brand-muted">
                    {job.openings} participant{" "}
                    {job.openings === 1 ? "spot" : "spots"} remaining
                    <span className="mx-2 text-brand-sand">|</span>
                    {job.applicationCount} linked application
                    {job.applicationCount === 1 ? "" : "s"}
                  </p>
                  {job.isActive ? (
                    <HomeProjectToggle
                      jobId={job.id}
                      openings={job.openings}
                      showOnHome={job.showOnHome}
                    />
                  ) : null}
                  <div className="mt-4">
                    <ProjectLifecycleActions
                      applicationCount={job.applicationCount}
                      isActive={job.isActive}
                      jobId={job.id}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <aside className="h-fit rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
            Fresh project record
          </p>
          <h2 className="mt-2 text-xl font-semibold text-brand-ink">
            Create project
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Every submission creates a new application pool. Use this when a
            closed project needs a fresh run.
          </p>
          <div className="mt-5">
            <JobCreateForm />
          </div>
        </aside>
      </section>
      </main>
    </>
  );
}
