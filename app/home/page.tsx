import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { HomeDashboardClient } from "@/components/home-dashboard-client";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db/prisma";
import { ReferralService } from "@/lib/services/referral-service";
import { JobService } from "@/lib/services/job-service";
import { LedgerService } from "@/lib/services/ledger-service";
import {
  emptyOnboardingStatus,
  OnboardingService,
} from "@/lib/services/onboarding-service";
import { buildTaskAssignment } from "@/lib/task-assignment";

export const dynamic = "force-dynamic";

function formatHoursWorked(hours: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(hours);
}

function formatCurrency(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format((cents ?? 0) / 100);
}

function projectStatusLabel(status: string, submittedAt?: Date | null) {
  if (submittedAt) {
    return "Submitted for review";
  }

  const labels: Record<string, string> = {
    APPLIED: "Application under review",
    CERTIFYING: "Submission under review",
    CERTIFIED: "Ready to start",
    MATCHED: "Matched",
    ACTIVE: "Active",
    PAYOUT_ELIGIBLE: "Payment eligible",
    PAID: "Paid",
    EXPIRED: "Expired",
    REJECTED: "Not selected",
  };

  return labels[status] ?? status;
}

export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";
  const userId = session?.user?.id;
  const onboardingPromise = userId
    ? OnboardingService.getStatus(userId)
    : Promise.resolve(emptyOnboardingStatus());

  const paymentSummaryPromise = userId
    ? Promise.all([
        LedgerService.getBalanceSummary(userId),
        prisma.application.aggregate({
          where: { applicantUserId: userId },
          _sum: { hoursLogged: true },
        }),
      ]).then(([wallet, hours]) => ({
        formattedAwaitingPayment: wallet.formattedHoldingBalance,
        formattedHoursWorked: formatHoursWorked(hours._sum.hoursLogged ?? 0),
      }))
    : Promise.resolve({
        formattedAwaitingPayment: "$0.00",
        formattedHoursWorked: "0",
      });

  const projectsPromise = userId
    ? Promise.all([
        onboardingPromise,
        prisma.application.findMany({
          where: { applicantUserId: userId },
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: {
            id: true,
            jobId: true,
            createdAt: true,
            status: true,
            lockedPayoutCents: true,
            taskSubmittedAt: true,
            taskSubmissionFileName: true,
            job: {
              select: {
                title: true,
                description: true,
                companyName: true,
                payoutAmountCents: true,
                payoutType: true,
                skills: {
                  select: {
                    label: true,
                  },
                },
              },
            },
          },
        }),
      ]).then(([onboarding, applications]) =>
          applications.map((application) => {
            const skills = application.job.skills.map((skill) => skill.label);
            const hasTaskAccess = ["ACTIVE", "MATCHED", "CERTIFIED"].includes(
              application.status,
            );
            const canSubmit =
              onboarding.complete &&
              !application.taskSubmittedAt &&
              hasTaskAccess;
            const taskAssignment = buildTaskAssignment({
              id: application.id,
              candidateName: userName,
              job: application.job,
            });

            return {
              id: application.id,
              applicationId: application.id,
              applyHref: `/jobs/${application.jobId}/apply`,
              jobHref: `/jobs/${application.jobId}`,
              appliedAt: application.createdAt.toISOString(),
              title: application.job.title,
              description: application.job.description,
              companyName: application.job.companyName,
              status: application.status,
              statusLabel:
                !onboarding.complete &&
                hasTaskAccess &&
                !application.taskSubmittedAt
                  ? "Onboarding review pending"
                  : projectStatusLabel(
                      application.status,
                      application.taskSubmittedAt,
                    ),
              payoutLabel: formatCurrency(
                application.lockedPayoutCents ??
                  application.job.payoutAmountCents,
              ),
              payoutType:
                application.job.payoutType === "TASK_1"
                  ? "Per approved task"
                  : "After approved hours",
              skills,
              canSubmit,
              isSubmitted: Boolean(application.taskSubmittedAt),
              submittedFileName: application.taskSubmissionFileName,
              briefHref: onboarding.complete
                ? `/api/v1/applications/${application.id}/task-material`
                : undefined,
              taskBrief: onboarding.complete
                ? taskAssignment.sections.filter(
                    (section) => section.heading !== "Candidate and role",
                  )
                : [],
            };
          }),
        )
    : Promise.resolve([]);

  const referralPromise = userId
    ? ReferralService.getMyLinks(userId, getAppUrl())
    : Promise.resolve(null);

  const [paymentSummary, projects, featuredProjects, onboarding, referral] =
    await Promise.all([
      paymentSummaryPromise,
      projectsPromise,
      JobService.listHomeProjects(),
      onboardingPromise,
      referralPromise,
    ]);
  const featuredProjectCards = featuredProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    companyName: project.companyName,
    formattedPayout: project.formattedPayout,
    formattedHourlyPay: project.formattedHourlyPay,
    skills: project.skills,
  }));

  return (
    <div className="flex min-h-[100dvh] bg-[#eeece5] text-brand-ink">
      <PortalSidebar
        activeTab="home"
        isAuthenticated={Boolean(userId)}
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-7 flex items-center justify-between gap-4 border-b border-brand-sand/70 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold-strong">
                Workspace
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Your work, referrals, and payouts in one place.
              </p>
            </div>
            <span className="hidden text-xs font-medium text-brand-muted sm:block">
              Trinity-AI
            </span>
          </div>
          <HomeDashboardClient
            featuredProjects={featuredProjectCards}
            onboardingComplete={onboarding.complete}
            paymentSummary={paymentSummary}
            projects={projects}
            referralLink={referral?.url ?? null}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
