import Link from "next/link";
import { notFound } from "next/navigation";

import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

function withReferral(href: string, referralCode?: string) {
  if (!referralCode) {
    return href;
  }

  return `${href}?ref=${encodeURIComponent(referralCode)}`;
}

function openingLabel(openings: number) {
  return `${openings} ${openings === 1 ? "opening" : "openings"}`;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: JobDetailPageProps) {
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const referralCode = query.ref ?? query.referralCode;
  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f3f6ff] text-[#202235]">
      <section className="border-b border-[#d9def7] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link className="text-sm font-semibold text-[#626cff]" href="/jobs">
            All roles
          </Link>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="text-[#65708a]">{job.postedAtLabel}</span>
                {job.isNew ? (
                  <span className="rounded bg-[#f2ddff] px-2 py-0.5 text-[#8b3cc2]">
                    New
                  </span>
                ) : null}
                {job.isHighDemand ? (
                  <span className="rounded bg-[#d7f7f0] px-2 py-0.5 text-[#047a66]">
                    High demand
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-tight text-[#111427] sm:text-5xl">
                {job.title}
              </h1>
              <p className="mt-3 text-sm font-medium text-[#667085]">
                {job.companyName} <span className="px-2 text-[#b3b8ca]">|</span>
                {openingLabel(job.openings)}
              </p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#5f687f]">
                {job.description}
              </p>
            </div>
            <aside className="rounded-md border border-[#cfd7ff] bg-[#f8faff] p-5">
              <p className="text-sm font-semibold text-[#667085]">Job pay</p>
              <p className="mt-2 text-2xl font-black text-[#202235]">
                {job.formattedHourlyPay ?? "Discussed during review"}
              </p>
              <div className="mt-5 border-t border-[#d9def7] pt-5">
                <p className="text-sm font-semibold text-[#667085]">
                  Referral payout
                </p>
                <p className="mt-2 text-3xl font-black text-[#126d61]">
                  {job.formattedPayout}
                </p>
                <p className="mt-1 text-sm text-[#69728a]">
                  {job.payoutTriggerLabel}
                </p>
              </div>
              <Link
                className="mt-5 flex h-11 items-center justify-center rounded-md bg-[#202235] px-4 text-sm font-semibold text-white transition hover:bg-[#626cff]"
                href={withReferral(`/jobs/${job.id}/apply`, referralCode)}
              >
                Apply now
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-md border border-[#cfd7ff] bg-white p-5">
            <h2 className="text-xl font-black text-[#202235]">
              About this role
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5f687f]">
              {job.description}
            </p>
          </div>
          <div className="rounded-md border border-[#cfd7ff] bg-white p-5">
            <h2 className="text-xl font-black text-[#202235]">
              How the payout works
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#5f687f]">
              Referral attribution is captured from the first referral link used
              before application submission. The referral payout shown here is
              locked when a candidate applies, so later payout changes do not
              affect existing applications.
            </p>
          </div>
        </div>

        <aside className="rounded-md border border-[#cfd7ff] bg-white p-5">
          <h2 className="text-xl font-black text-[#202235]">Required skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                className="rounded border border-[#d9deef] bg-[#fbfcff] px-2.5 py-1 text-xs font-medium text-[#4c5875]"
                key={skill.id}
              >
                {skill.label}
              </span>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
