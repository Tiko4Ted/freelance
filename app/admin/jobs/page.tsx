import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { JobCreateForm } from "@/components/admin/job-create-form";
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href="/admin">
            Admin
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Jobs
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_24rem] md:px-8">
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {jobs.map((job) => (
            <article className="p-5" key={job.id}>
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <h2 className="font-semibold text-slate-950">{job.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>
                </div>
                <p className="text-sm font-semibold text-teal-700">
                  {job.isActive ? "ACTIVE" : "INACTIVE"}
                </p>
              </div>
            </article>
          ))}
        </div>
        <aside className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">Create job</h2>
          <div className="mt-5">
            <JobCreateForm />
          </div>
        </aside>
      </section>
    </main>
  );
}
