import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href="/">
            ReferralJobs
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Admin
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2 md:px-8">
        <Link
          className="border border-slate-200 bg-white p-5 transition hover:border-teal-700"
          href="/admin/jobs"
        >
          <p className="text-sm font-medium text-slate-500">Jobs</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">
            {jobs.length}
          </p>
        </Link>
        <Link
          className="border border-slate-200 bg-white p-5 transition hover:border-teal-700"
          href="/admin/applications"
        >
          <p className="text-sm font-medium text-slate-500">Applications</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">
            {applications.length}
          </p>
        </Link>
      </section>
    </main>
  );
}
