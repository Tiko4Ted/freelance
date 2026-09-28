import { buildJobDetailCopy } from "@/lib/job-detail-copy";
import type { PublicJobView } from "@/lib/services/job-service";
import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Timer } from "lucide-react";

type JobDetailContentProps = {
  applyHref: string;
  job: PublicJobView;
};

function openingLabel(openings: number) {
  return `${openings} ${openings === 1 ? "opening" : "openings"}`;
}

export function JobDetailContent({ applyHref, job }: JobDetailContentProps) {
  const detailCopy = buildJobDetailCopy(job);
  const payLabel = job.formattedHourlyPay ?? job.formattedPayout;

  return (
    <section className="mx-auto max-w-[1040px] pb-12">
      <header className="grid gap-8 border-b border-brand-sand/80 py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end lg:gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold-strong">
            Role details
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-brand-ink sm:text-5xl">
            {job.title}
          </h1>
          <p className="mt-4 text-sm font-medium text-brand-muted">
            Posted by Trinity-AI
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-sand bg-brand-ivory px-3.5 py-2 text-sm font-medium text-brand-ink">
              <Timer aria-hidden="true" className="h-4 w-4 text-brand-gold-strong" />
              {job.payoutTriggerLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-sand bg-brand-ivory px-3.5 py-2 text-sm font-medium text-brand-ink">
              <MapPin aria-hidden="true" className="h-4 w-4 text-brand-gold-strong" />
              Remote
            </span>
          </div>
        </div>

        <aside className="rounded-[18px] bg-brand-ink p-5 text-brand-ivory shadow-brand-card">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-light">
            Ready to apply?
          </p>
          <p className="mt-3 text-lg font-semibold leading-tight">
            Start with your details, then complete the aptitude test.
          </p>
          <Link
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-brand-gold-light px-4 text-sm font-semibold text-brand-ink transition hover:bg-brand-gold active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand-gold-light/30"
            href={applyHref}
          >
            Apply for this role
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs leading-5 text-brand-gold-light/70">
            You can review the role before submitting your application.
          </p>
        </aside>
      </header>

      <div className="grid gap-10 py-9 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-14">
        <article className="min-w-0 text-[15px] leading-7 text-brand-ink">
          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-ink">
              The opportunity
            </h2>
            <p className="mt-4 max-w-[68ch]">{detailCopy.intro}</p>
          </section>

          <section className="mt-10 border-t border-brand-sand/80 pt-7">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-ink">
              Scope of work
            </h2>
            <ul className="mt-5 space-y-4">
              {detailCopy.scope.map((item) => (
                <li className="flex gap-3" key={item}>
                  <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-gold-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 border-t border-brand-sand/80 pt-7">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-ink">
              Preferred qualifications
            </h2>
            <ul className="mt-5 space-y-4">
              {detailCopy.qualifications.map((item) => (
                <li className="flex gap-3" key={item}>
                  <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-gold-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {detailCopy.note ? (
            <p className="mt-10 border-l-2 border-brand-gold pl-4 text-sm leading-6 text-brand-muted">
              {detailCopy.note}
            </p>
          ) : null}
        </article>

        <aside className="self-start lg:sticky lg:top-16">
          <div className="border-t border-brand-sand/80 pt-5">
            <h2 className="text-sm font-semibold text-brand-ink">At a glance</h2>
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="text-xs font-medium text-brand-muted">Pay</dt>
                <dd className="mt-1 font-semibold text-brand-ink">{payLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-muted">Openings</dt>
                <dd className="mt-1 font-semibold text-brand-ink">{openingLabel(job.openings)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-muted">Engagement</dt>
                <dd className="mt-1 font-semibold text-brand-ink">Contractor</dd>
              </div>
            </dl>
          </div>

          <div className="mt-9 border-t border-brand-sand/80 pt-5">
            <h2 className="text-sm font-semibold text-brand-ink">Required skills</h2>
            <div className="mt-4 space-y-2">
              {job.skills.map((skill) => (
                <div className="flex items-start gap-2 text-sm leading-5 text-brand-muted" key={skill.id}>
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold-strong" />
                  <span>{skill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t border-brand-sand/80 pt-6 lg:hidden">
        <Link
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[var(--color-action-hover)] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-brand-gold/20"
          href={applyHref}
        >
          Apply for this role
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
