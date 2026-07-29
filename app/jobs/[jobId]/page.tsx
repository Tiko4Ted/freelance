import Link from "next/link";
import { notFound } from "next/navigation";

import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { jobId } = await params;
  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href="/jobs">
            Jobs
          </Link>
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_18rem]">
            <div>
              <h1 className="text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
                {job.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                {job.description}
              </p>
            </div>
            <aside className="border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Referral payout
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {job.formattedPayout}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {job.payoutTriggerLabel}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-[1fr_18rem] md:px-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              About this role
            </h2>
            <div className="mt-4 border border-slate-200 bg-white p-5">
              <p className="text-sm leading-7 text-slate-700">
                {job.description}
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              How the payout works
            </h2>
            <div className="mt-4 border border-slate-200 bg-white p-5">
              <p className="text-sm leading-7 text-slate-700">
                Referral attribution is captured from the first referral link
                used before application submission. The payout amount shown
                here is locked for candidates at application time, so later
                changes to this job&apos;s payout won&apos;t affect anyone who
                already applied.
              </p>
            </div>
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">Application</h2>
          <Link
            className="mt-4 inline-flex h-10 w-full items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
            href={`/jobs/${job.id}/apply`}
          >
            Apply
          </Link>
        </div>
      </section>
    </main>
  );
}
