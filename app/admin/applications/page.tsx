import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ApplicationActions } from "@/components/admin/application-actions";
import { StatusBadge } from "@/components/status-badge";
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
    <main className="min-h-screen bg-brand-canvas text-brand-ink">
      <section className="border-b border-brand-sand bg-brand-ivory">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-brand-gold-strong hover:underline" href="/admin">
            Admin
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-brand-ink md:text-5xl">
            Applications
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-8">
        <div className="divide-y divide-brand-sand overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
          {applications.length ? (
            applications.map((application) => (
              <article
                className="grid gap-5 p-5 lg:grid-cols-[1fr_28rem]"
                key={application.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold text-brand-ink">
                      {application.candidateName}
                    </h2>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="mt-2 text-sm text-brand-muted">
                    {application.candidateEmail}
                  </p>
                  {application.candidatePhoneNumber ? (
                    <p className="mt-2 text-sm text-brand-muted">
                      Phone:{" "}
                      {[
                        application.candidatePhoneCountry,
                        application.candidatePhoneCountryCode,
                        application.candidatePhoneNumber,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  ) : null}
                  {application.candidateLinkedinUrl ? (
                    <p className="mt-2 break-all text-sm text-brand-muted">
                      LinkedIn: {application.candidateLinkedinUrl}
                    </p>
                  ) : null}
                  {application.resumeFileName ? (
                    <p className="mt-2 break-all text-sm text-brand-muted">
                      Resume: {application.resumeFileName}
                    </p>
                  ) : null}
                  {application.startAvailabilityDays !== null ? (
                    <p className="mt-2 text-sm text-brand-muted">
                      Starts in: {application.startAvailabilityDays} days
                    </p>
                  ) : null}
                  {application.expectedHourlyRateUsd !== null ? (
                    <p className="mt-2 text-sm text-brand-muted">
                      Expected rate: ${application.expectedHourlyRateUsd}/hour
                    </p>
                  ) : null}
                  {application.weeklyAvailabilityHours !== null ? (
                    <p className="mt-2 text-sm text-brand-muted">
                      Availability: {application.weeklyAvailabilityHours} hours/week
                    </p>
                  ) : null}
                  {application.strongestTools.length ? (
                    <p className="mt-2 text-sm text-brand-muted">
                      Tools: {application.strongestTools.join(", ")}
                    </p>
                  ) : null}
                  {application.aptitudeScorePercent !== null ? (
                    <div className="mt-4 rounded-xl border border-brand-sand bg-brand-canvas/60 p-3 text-sm text-brand-muted">
                      <p className="font-semibold text-brand-ink">
                        Aptitude test
                      </p>
                      <p className="mt-2">
                        Score: {application.aptitudeScorePercent}% (
                        {application.aptitudeCorrectAnswers}/
                        {application.aptitudeQuestionCount} correct)
                      </p>
                      <p className="mt-1">
                        Result:{" "}
                        {application.aptitudePassed
                          ? "Auto-approved"
                          : "Needs manual review"}
                      </p>
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm text-brand-muted">
                    {application.job.title}
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">
                    Referrer: {application.referrer?.email ?? "none"}
                  </p>
                  {application.taskSubmittedAt ? (
                    <div className="mt-4 rounded-xl border border-brand-sand bg-brand-canvas/60 p-3 text-sm text-brand-muted">
                      <p className="font-semibold text-brand-ink">
                        Submitted task
                      </p>
                      <p className="mt-2 break-all">
                        File: {application.taskSubmissionFileName ?? "none"}
                      </p>
                      <p className="mt-1">
                        Submitted:{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(application.taskSubmittedAt))}
                      </p>
                      {application.taskSubmissionNotes ? (
                        <p className="mt-2 whitespace-pre-wrap">
                          Notes: {application.taskSubmissionNotes}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
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
            <p className="p-5 text-sm text-brand-muted">No applications yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
