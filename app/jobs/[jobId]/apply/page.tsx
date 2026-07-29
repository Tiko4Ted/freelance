import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/application-form";
import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

const REFERRAL_COOKIE_NAME = "ref_code";

type ApplyPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { jobId } = await params;
  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  const cookieStore = await cookies();
  const referralCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  const referralDetected = Boolean(
    referralCookie && referralCookie.startsWith(`${job.id}:`),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8 md:px-8">
          <Link className="text-sm font-medium text-teal-700" href={`/jobs/${job.id}`}>
            {job.title}
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Candidate application
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Referral payout: {job.formattedPayout}, {job.payoutTriggerLabel}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-8 md:px-8">
        <div
          className={
            referralDetected
              ? "mb-5 border border-teal-700 bg-teal-50 p-4 text-sm font-medium text-teal-800"
              : "mb-5 border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-800"
          }
        >
          {referralDetected
            ? "Referred by a link ✓ — this application will be credited to that referrer."
            : "No referral detected — you'll be applying directly, with no referrer credited."}
        </div>
        <div className="border border-slate-200 bg-white p-5">
          <ApplicationForm jobId={job.id} />
        </div>
      </section>
    </main>
  );
}
