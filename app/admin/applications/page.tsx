import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApplicationActions } from "@/components/admin/application-actions";
import { requireRole } from "@/lib/auth/session";
import { AdminApplicationService } from "@/lib/services/admin-application-service";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  try {
    await requireRole(Role.ADMIN);
  } catch {
    redirect("/login");
  }

  const applications = await AdminApplicationService.listApplications();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href="/admin">
            Admin
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Applications
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-8">
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {applications.length ? (
            applications.map((application) => (
              <article
                className="grid gap-5 p-5 lg:grid-cols-[1fr_28rem]"
                key={application.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-slate-950">
                      {application.candidateName}
                    </h2>
                    <span className="text-sm font-semibold text-teal-700">
                      {application.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {application.candidateEmail}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {application.job.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Referrer: {application.referrer?.email ?? "none"}
                  </p>
                </div>
                <ApplicationActions
                  applicationId={application.id}
                  currentStatus={application.status}
                  hoursLogged={application.hoursLogged}
                  tasksCompleted={application.tasksCompleted}
                />
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-slate-600">No applications yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
