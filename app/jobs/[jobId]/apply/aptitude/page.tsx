import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AptitudeTestForm } from "@/components/aptitude-test-form";
import { PortalSidebar } from "@/components/portal-sidebar";
import { buildAptitudeTest } from "@/lib/aptitude-test";
import { JobService } from "@/lib/services/job-service";
import { OnboardingService } from "@/lib/services/onboarding-service";

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

  const [job, onboarding] = await Promise.all([
    JobService.getActiveJob(jobId),
    OnboardingService.getStatus(session.user.id),
  ]);

  if (!job) {
    notFound();
  }

  if (!onboarding.complete) {
    redirect("/onboarding");
  }

  const aptitudeTest = buildAptitudeTest(job);

  return (
    <>
      <PortalSidebar
        activeTab="apply"
        isAuthenticated
        userName={session.user.name ?? "Teddy"}
      />
      <main className="min-h-screen bg-brand-canvas px-5 pb-6 pt-[96px] text-brand-ink sm:px-8">
        <div className="mx-auto max-w-[960px]">
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
            automaticApproval={job.showOnHome}
            aptitudeTest={aptitudeTest}
            jobId={job.id}
          />
        </section>
        </div>
      </main>
    </>
  );
}
