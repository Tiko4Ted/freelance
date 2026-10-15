import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { AptitudeTestForm } from "@/components/aptitude-test-form";
import { PortalSidebar } from "@/components/portal-sidebar";
import {
  AptitudeGateError,
  AptitudeService,
  APTITUDE_MAX_ATTEMPTS,
  APTITUDE_RETRY_DELAY_HOURS,
} from "@/lib/services/aptitude-service";
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

  if (session.user.role === Role.ADMIN) {
    redirect("/admin");
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

  let attempt: Awaited<ReturnType<typeof AptitudeService.getOrCreateAttempt>> | null = null;
  let gateMessage: string | null = null;

  try {
    attempt = await AptitudeService.getOrCreateAttempt(job.id, {
      id: session.user.id,
      email: session.user.email ?? "",
    });
  } catch (error) {
    if (error instanceof AptitudeGateError) {
      gateMessage =
        error.code === "APTITUDE_RETRY_NOT_AVAILABLE"
          ? `You have used an aptitude attempt for this project. You can try again after ${error.retryAvailableAt?.toLocaleString() ?? "the retry window"}. We will email you when the ${APTITUDE_RETRY_DELAY_HOURS}-hour waiting period ends.`
          : error.code === "APTITUDE_ATTEMPTS_EXHAUSTED"
            ? `You have reached the ${APTITUDE_MAX_ATTEMPTS}-attempt limit for this project. Further aptitude attempts are blocked for this email address.`
            : "You have already passed this project's aptitude test. Open your home page to continue.";
    } else {
      throw error;
    }
  }

  return (
    <>
      <PortalSidebar
        activeTab="apply"
        isAuthenticated
        userName={session.user.name ?? "Teddy"}
      />
      <main className="min-h-screen bg-brand-canvas px-5 pb-6 pt-[96px] text-brand-ink sm:px-8 lg:pl-64">
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
          {gateMessage ? (
            <section className="rounded-lg border border-brand-sand bg-brand-ivory p-6 text-brand-ink shadow-brand-card">
              <h2 className="text-xl font-semibold">Aptitude test unavailable</h2>
              <p className="mt-3 text-sm leading-6 text-brand-muted">{gateMessage}</p>
            </section>
          ) : attempt ? (
            <AptitudeTestForm
              applicationHref={applyHref(job.id, referralCode)}
              attemptId={attempt.id}
              attemptNumber={attempt.attemptNumber}
              automaticApproval={job.showOnHome}
              aptitudeTest={attempt.questions}
              jobId={job.id}
            />
          ) : null}
        </section>
        </div>
      </main>
    </>
  );
}
