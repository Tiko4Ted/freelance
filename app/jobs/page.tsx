import Link from "next/link";

import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await JobService.listActiveJobs();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href="/">
            ReferralJobs
          </Link>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950 md:text-5xl">
                Open referral jobs
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Active roles with fixed referral payouts locked when a candidate
                applies.
              </p>
            </div>
            <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-950">
                {jobs.length}
              </span>{" "}
              active roles
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 md:px-8">
        <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
          {jobs.map((job) => (
            <article className="grid gap-5 p-5 md:grid-cols-[1fr_auto]" key={job.id}>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {job.title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  {job.description}
                </p>
              </div>
              <div className="flex min-w-52 flex-col items-start gap-3 md:items-end">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">
                    {job.formattedPayout}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.payoutTriggerLabel}
                  </p>
                </div>
                <Link
                  className="inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
                  href={`/jobs/${job.id}`}
                >
                  View role
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
