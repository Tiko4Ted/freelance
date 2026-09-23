import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ApplicationForm } from "@/components/application-form";
import { BrandLogo } from "@/components/brand-logo";
import { buildJobDetailCopy } from "@/lib/job-detail-copy";
import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

type ApplyPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

const ABOUT_TRINITY_AI = [
  "Trinity-AI is an AI talent and data platform for training frontier models and evaluating AI agents. Experts contribute diverse subject matter knowledge across finance, healthcare, STEM, engineering, and more. Trinity-AI turns real-world expertise into high-quality training data, evaluations, and feedback loops that improve how AI systems learn, reason, and perform.",
  "Our platform identifies and vets top talent through an AI-powered application flow, enabling high-quality expert contributions at scale. As our global expert network grows, Trinity-AI is building the human intelligence layer for frontier AI.",
];

function formatApplyPay(formattedHourlyPay: string | null) {
  if (!formattedHourlyPay) {
    return "Pay discussed";
  }

  return formattedHourlyPay.replace("/hr", "/hour");
}

function formatSkillLabel(label: string) {
  if (label.toLowerCase() === "crm") {
    return "CRM";
  }

  return label;
}

function applyHref(jobId: string, referralCode?: string) {
  const href = `/jobs/${jobId}/apply`;

  if (!referralCode) {
    return href;
  }

  return `${href}?referralCode=${encodeURIComponent(referralCode)}`;
}

function aptitudeHref(jobId: string, referralCode?: string) {
  const href = `/jobs/${jobId}/apply/aptitude`;

  if (!referralCode) {
    return href;
  }

  return `${href}?referralCode=${encodeURIComponent(referralCode)}`;
}

export default async function ApplyPage({
  params,
  searchParams,
}: ApplyPageProps) {
  const [{ jobId }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const referralCode = query.ref ?? query.referralCode;

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(applyHref(jobId, referralCode))}`,
    );
  }

  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  const detailCopy = buildJobDetailCopy(job);
  const payLabel = formatApplyPay(job.formattedHourlyPay);

  return (
    <main className="min-h-screen bg-brand-canvas text-brand-ink">
      <div className="mx-auto grid max-w-[1050px] gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24.25rem] lg:gap-11 lg:px-0">
        <article className="min-w-0">
          <BrandLogo
            imageClassName="h-12 w-12 shadow-sm"
            nameClassName="text-[24px] font-black leading-none tracking-normal text-brand-ink"
            showName
            size={48}
          />

          <header className="mt-7">
            <h1 className="text-[30px] font-semibold leading-tight tracking-normal text-brand-ink">
              {job.title}
            </h1>

            <div className="mt-4 inline-flex items-center rounded border border-brand-sand bg-[#f2e8d7] px-3 py-2 text-[14px] font-semibold text-brand-gold-strong">
              <span>{payLabel}</span>
              {job.formattedHourlyPay ? (
                <span className="ml-1 text-[12px] font-normal text-brand-muted">
                  pay
                </span>
              ) : null}
            </div>
          </header>

          <section className="mt-7">
            <h2 className="text-[16px] font-semibold text-brand-ink">
              Required Skills
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span
                  className="rounded border border-brand-sand bg-brand-ivory px-3 py-2 text-[14px] leading-none text-brand-muted"
                  key={skill.id}
                >
                  {formatSkillLabel(skill.label)}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-md border border-brand-sand bg-brand-ivory px-4 py-4 text-[12px] leading-[1.45] text-brand-muted shadow-brand-card sm:px-5">
            <h2 className="text-[14px] font-semibold text-brand-ink">
              About Trinity-AI
            </h2>
            <div className="mt-2 space-y-3">
              {ABOUT_TRINITY_AI.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mt-9 max-w-[650px] text-[15px] leading-[1.55] text-brand-ink">
            <div className="space-y-7">
              <p>
                <span className="font-medium">Role Title:</span> {job.title}
              </p>
              <p>
                <span className="font-medium">Role Type:</span> Contractor
              </p>
              <p>
                <span className="font-medium">Location:</span> Remote
              </p>
            </div>

            <p className="mt-7">{detailCopy.intro}</p>

            <section className="mt-7">
              <h2 className="font-medium">Scope of Work</h2>
              <ul className="mt-1 list-disc space-y-1 pl-7">
                {detailCopy.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-7">
              <h2 className="font-medium">Preferred Qualifications</h2>
              <ul className="mt-1 list-disc space-y-1 pl-7">
                {detailCopy.qualifications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {detailCopy.note ? <p className="mt-7">{detailCopy.note}</p> : null}
          </section>
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ApplicationForm
            applicantEmail={session.user.email ?? ""}
            aptitudeHref={aptitudeHref(job.id, referralCode)}
            jobId={job.id}
          />
        </aside>
      </div>
    </main>
  );
}
