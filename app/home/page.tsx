import { PortalSidebar } from "@/components/portal-sidebar";
import { HomeDashboardClient } from "@/components/home-dashboard-client";
import { getAppUrl } from "@/lib/app-url";
import { requirePageSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ReferralService } from "@/lib/services/referral-service";
import { JobService } from "@/lib/services/job-service";
import { LedgerService } from "@/lib/services/ledger-service";
import {
  emptyOnboardingStatus,
  OnboardingService,
} from "@/lib/services/onboarding-service";

export const dynamic = "force-dynamic";

function formatTasksCompleted(tasks: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(tasks);
}

function formatCurrency(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format((cents ?? 0) / 100);
}

function formatProjectPayout(
  cents: number | null | undefined,
  payoutType: string,
) {
  const payout = formatCurrency(cents);

  return payoutType === "TASK_1" ? `${payout} per task` : payout;
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
    REJECTED: "Failed",
  };

  return labels[status] ?? status;
}

export default async function HomePage() {
  const session = await requirePageSession("/home");
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
          _sum: { tasksCompleted: true },
        }),
      ]).then(([wallet, tasks]) => ({
        formattedAwaitingPayment: wallet.formattedHoldingBalance,
        formattedTasksCompleted: formatTasksCompleted(
          tasks._sum.tasksCompleted ?? 0,
        ),
      }))
    : Promise.resolve({
        formattedAwaitingPayment: "$0.00",
        formattedTasksCompleted: "0",
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
                showOnHome: true,
                isAiTask: true,
                annotationProject: { select: { id: true } },
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
            const taskAvailable = onboarding.complete && hasTaskAccess;
            const canSubmit = taskAvailable && !application.taskSubmittedAt;

            return {
              id: application.id,
              applicationId: application.id,
              jobId: application.jobId,
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
              payoutLabel: formatProjectPayout(
                application.lockedPayoutCents ??
                  application.job.payoutAmountCents,
                application.job.payoutType,
              ),
              skills,
              canSubmit,
              isSubmitted: Boolean(application.taskSubmittedAt),
              submittedFileName: application.taskSubmissionFileName,
              briefHref: taskAvailable
                ? `/api/v1/applications/${application.id}/task-material`
                : undefined,
              annotationHref: taskAvailable && application.job.annotationProject
                ? `/home/projects/${application.jobId}/task`
                : undefined,
              isApplied: true,
              showOnHome: application.job.showOnHome,
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
  const appliedJobIds = new Set(
    projects.flatMap((project) => (project.jobId ? [project.jobId] : [])),
  );
  const featuredProjectCards = featuredProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    companyName: project.companyName,
    formattedPay: project.formattedPay ?? project.formattedPayout,
    participantCount: project.participantCount,
    participantCountLabel: project.participantCountLabel,
    isApplied: appliedJobIds.has(project.id),
    skills: project.skills,
  }));

  return (
    <div className="flex min-h-[100dvh] bg-[#eeece5] text-brand-ink">
      <PortalSidebar
        activeTab="home"
        isAuthenticated={Boolean(userId)}
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-5 pb-6 pt-20 md:px-10 md:pb-8 md:pt-24 lg:pl-64">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-brand-sand/70 pb-2">
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
