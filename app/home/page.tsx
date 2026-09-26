import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { HomeDashboardClient } from "@/components/home-dashboard-client";
import { prisma } from "@/lib/db/prisma";
import { JobService } from "@/lib/services/job-service";
import { LedgerService } from "@/lib/services/ledger-service";
import { OnboardingService } from "@/lib/services/onboarding-service";
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

  const paymentSummaryPromise = userId
    ? Promise.all([
        LedgerService.getWallet(userId),
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
        OnboardingService.getStatus(userId),
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

  const [paymentSummary, projects, featuredProjects] = await Promise.all([
    paymentSummaryPromise,
    projectsPromise,
    JobService.listHomeProjects(),
  ]);
  const featuredProjectCards = featuredProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    companyName: project.companyName,
    openings: project.openings,
    formattedPayout: project.formattedPayout,
    formattedHourlyPay: project.formattedHourlyPay,
    skills: project.skills,
  }));

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="home"
        isAuthenticated={Boolean(userId)}
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px]">
          <HomeDashboardClient
            featuredProjects={featuredProjectCards}
            paymentSummary={paymentSummary}
            projects={projects}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
