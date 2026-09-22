import { buildJobDetailCopy } from "@/lib/job-detail-copy";
import type { PublicJobView } from "@/lib/services/job-service";

type JobDetailContentProps = {
  job: PublicJobView;
};

function openingLabel(openings: number) {
  return `${openings} ${openings === 1 ? "opening" : "openings"}`;
}

export function JobDetailContent({ job }: JobDetailContentProps) {
  const detailCopy = buildJobDetailCopy(job);

  return (
    <section className="mx-auto max-w-[852px]">
      <h1 className="text-[32px] font-semibold leading-tight text-brand-ink sm:text-[34px]">
        {job.title}
      </h1>
      <p className="mt-4 text-sm font-medium text-brand-muted">
        Posted by Trinity-AI
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <span className="rounded-md border border-brand-sand bg-brand-ivory px-4 py-3 text-sm text-brand-ink">
          {openingLabel(job.openings)}
        </span>
        {job.formattedHourlyPay ? (
          <span className="rounded-md bg-[#effbf3] px-4 py-3 text-sm font-medium text-[#008a45]">
            {job.formattedHourlyPay}
          </span>
        ) : null}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-brand-ink">
          Required Skills
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span
              className="rounded-full border border-brand-sand bg-brand-ivory px-4 py-2 text-sm text-brand-muted"
              key={skill.id}
            >
              {skill.label}
            </span>
          ))}
        </div>
      </div>

      <article className="mt-6 rounded-xl border border-brand-sand bg-brand-ivory px-6 py-7 text-[15px] leading-[1.55] text-brand-ink shadow-brand-card sm:px-7">
        <h2 className="text-lg font-semibold text-brand-ink">
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
  );
}
