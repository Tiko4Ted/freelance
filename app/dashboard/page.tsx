import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CopyReferralLink } from "@/components/dashboard/copy-referral-link";
import { JobActivityList } from "@/components/dashboard/job-activity-list";
import { StatusBadge } from "@/components/status-badge";
import { ReferralService } from "@/lib/services/referral-service";

export const dynamic = "force-dynamic";

const successfulStatuses = new Set([
  "CERTIFIED",
  "MATCHED",
  "ACTIVE",
  "PAYOUT_ELIGIBLE",
  "PAID",
]);

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

function countByBucket(
  applications: Awaited<
    ReturnType<typeof ReferralService.getCandidateApplications>
  >,
) {
  return applications.reduce(
    (counts, application) => ({
      ...counts,
      [application.bucket]: counts[application.bucket] + 1,
    }),
    { pending: 0, successful: 0, failed: 0 },
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const origin = await getOrigin();
  const [referrals, referredApplications, candidateApplications] =
    await Promise.all([
    ReferralService.getMyLinks(session.user.id, origin),
    ReferralService.getMyApplications(session.user.id),
      ReferralService.getCandidateApplications(session.user.email ?? ""),
    ]);
  const taskCounts = countByBucket(candidateApplications);
  const totalTasks = candidateApplications.length;
  const referredApplicantCount = referredApplications.filter(
    (item) => item.application,
  ).length;
  const successfulReferralCount = referredApplications.filter(
    (item) =>
      item.application && successfulStatuses.has(item.application.status),
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 md:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link className="text-sm font-medium text-teal-700" href="/">
              ReferralJobs
            </Link>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center border border-slate-950 px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
                href="/jobs"
              >
                Jobs
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-slate-300 px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
                href="#referrals"
              >
                Referrals
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center border border-slate-300 px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
                href="/wallet"
              >
                Wallet
              </Link>
            </div>
          </nav>
          <div>
            <p className="text-sm font-medium text-slate-500">
              {session.user.email}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 md:text-5xl">
              Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Track every role you have applied for, review pending eligibility
              decisions, and share one referral link for the full app.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_20rem] md:px-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Job activity
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total tasks",
                value: totalTasks,
                detail: "All applications",
              },
              {
                label: "Pending",
                value: taskCounts.pending,
                detail: "Awaiting eligibility email",
              },
              {
                label: "Successful",
                value: taskCounts.successful,
                detail: "Matched or active work",
              },
              {
                label: "Failed",
                value: taskCounts.failed,
                detail: "Rejected or expired",
              },
            ].map((item) => (
              <article
                className="border border-slate-200 bg-white p-4"
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>

          <JobActivityList applications={candidateApplications} />
        </div>

        <aside className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Referral link
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Share this one app-wide invite link. Applicants choose the role after
            they open it.
          </p>
          <div className="mt-5">
            <CopyReferralLink url={referrals.url} />
          </div>
          <input
            className="mt-4 h-10 w-full border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
            readOnly
            value={referrals.url}
          />
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Referral code</dt>
              <dd className="font-medium text-slate-950">
                {referrals.referralCode}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Referrals</dt>
              <dd className="font-medium text-slate-950">
                {referredApplications.length}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Applied referrals</dt>
              <dd className="font-medium text-slate-950">
                {referredApplicantCount}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Successful referrals</dt>
              <dd className="font-medium text-slate-950">
                {successfulReferralCount}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8" id="referrals">
        <h2 className="text-xl font-semibold text-slate-950">
          Referrals
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Use this section to see who entered through your invite link, whether
          they applied, and the current status of their application.
        </p>
        <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-white">
          {referredApplications.length ? (
            referredApplications.map((item) => (
              <article
                className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
                key={item.id}
              >
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {item.application?.candidateName ?? "Pending application"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.job.title}
                  </p>
                </div>
                <StatusBadge status={item.application?.status ?? "CLICKED"} />
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-slate-600">
              No referrals yet. Share your single referral link to invite people
              into the job board.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
