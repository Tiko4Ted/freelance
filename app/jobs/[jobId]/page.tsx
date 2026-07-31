import { notFound } from "next/navigation";

import { JobDetailShell } from "@/components/jobs/job-detail-shell";
import { buildJobDetailCopy } from "@/lib/job-detail-copy";
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

function openingLabel(openings: number) {
  return `${openings} ${openings === 1 ? "opening" : "openings"}`;
}

function closeHref(referralCode?: string) {
  if (!referralCode) {
    return "/jobs";
  }

  return `/referral/jobs?referralCode=${encodeURIComponent(referralCode)}`;
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

  const detailCopy = buildJobDetailCopy(job);

  return (
    <JobDetailShell closeHref={closeHref(referralCode)}>
      <section className="mx-auto max-w-[852px]">
        <h1 className="text-[32px] font-semibold leading-tight text-[#262735] sm:text-[34px]">
          {job.title}
        </h1>
        <p className="mt-4 text-sm font-medium text-[#555b6c]">
          Posted by micro1
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-[#d8dbe7] bg-white px-4 py-3 text-sm text-[#3c4050]">
            {openingLabel(job.openings)}
          </span>
          {job.formattedHourlyPay ? (
            <span className="rounded-md bg-[#effbf3] px-4 py-3 text-sm font-semibold text-[#008a45]">
              {job.formattedHourlyPay}
            </span>
          ) : null}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#252635]">
            Required Skills
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                className="rounded-full border border-[#d8dbe7] bg-white px-4 py-2 text-sm text-[#3d4352]"
                key={skill.id}
              >
                {skill.label}
              </span>
            ))}
          </div>
        </div>

        <article className="mt-6 rounded-xl bg-white px-6 py-7 text-[15px] leading-[1.55] text-[#333747] shadow-[0_1px_0_rgba(16,24,40,0.02)] sm:px-7">
          <h2 className="text-lg font-semibold text-[#252635]">
            Job Description
          </h2>

          <div className="mt-6 space-y-7">
            <div className="space-y-6">
              <p>Role Title: {job.title}</p>
              <p>Role Type: Contractor</p>
              <p>Location: Remote</p>
            </div>

            <p>{detailCopy.intro}</p>

            <div>
              <p className="mb-2">Scope of Work</p>
              <div className="space-y-1">
                {detailCopy.scope.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2">Preferred Qualifications</p>
              <div className="space-y-1">
                {detailCopy.qualifications.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            {detailCopy.note ? <p>{detailCopy.note}</p> : null}
          </div>
        </article>
      </section>
    </JobDetailShell>
  );
}
