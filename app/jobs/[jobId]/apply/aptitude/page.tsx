import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AptitudeTestForm } from "@/components/aptitude-test-form";
import { BrandLogo } from "@/components/brand-logo";
import { buildAptitudeTest } from "@/lib/aptitude-test";
import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

type AptitudePageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

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

function formatSkillLabel(label: string) {
  if (label.toLowerCase() === "crm") {
    return "CRM";
  }

  return label;
}

export default async function AptitudePage({
  params,
  searchParams,
}: AptitudePageProps) {
  const [{ jobId }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const referralCode = query.ref ?? query.referralCode;

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(aptitudeHref(jobId, referralCode))}`,
    );
  }

  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  const aptitudeTest = buildAptitudeTest(job);

  return (
    <main className="min-h-screen bg-brand-canvas px-5 py-6 text-brand-ink sm:px-8">
      <div className="mx-auto max-w-[960px]">
        <BrandLogo
          imageClassName="h-12 w-12 shadow-sm"
          nameClassName="text-[24px] font-black leading-none tracking-normal text-brand-ink"
          showName
          size={48}
        />

        <header className="mt-7 border-b border-brand-sand pb-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-gold-strong">
            Application aptitude
          </p>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-normal text-brand-ink">
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <span
                className="rounded border border-brand-sand bg-brand-ivory px-3 py-2 text-[14px] leading-none text-brand-muted"
                key={skill.id}
              >
                {formatSkillLabel(skill.label)}
              </span>
            ))}
          </div>
        </header>

        <section className="py-8">
          <AptitudeTestForm
            applicationHref={applyHref(job.id, referralCode)}
            aptitudeTest={aptitudeTest}
            jobId={job.id}
          />
        </section>
      </div>
    </main>
  );
}
