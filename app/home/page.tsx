import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { HomeDashboardClient } from "@/components/home-dashboard-client";
import { prisma } from "@/lib/db/prisma";
import { LedgerService } from "@/lib/services/ledger-service";
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

  const paymentSummary = userId
    ? await Promise.all([
        LedgerService.getWallet(userId),
        prisma.application.aggregate({
          where: { applicantUserId: userId },
          _sum: { hoursLogged: true },
        }),
      ]).then(([wallet, hours]) => ({
        formattedAwaitingPayment: wallet.formattedHoldingBalance,
        formattedHoursWorked: formatHoursWorked(hours._sum.hoursLogged ?? 0),
      }))
    : {
        formattedAwaitingPayment: "$0.00",
        formattedHoursWorked: "0",
      };

  const projects = userId
    ? await prisma.application
        .findMany({
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
        })
        .then((applications) =>
          applications.map((application) => {
            const skills = application.job.skills.map((skill) => skill.label);
            const canSubmit =
              !application.taskSubmittedAt &&
              ["ACTIVE", "MATCHED", "CERTIFIED"].includes(application.status);
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
              statusLabel: projectStatusLabel(
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
              briefHref: `/api/v1/applications/${application.id}/task-material`,
              taskBrief: taskAssignment.sections.filter(
                (section) => section.heading !== "Candidate and role",
              ),
            };
          }),
        )
    : [];

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
            paymentSummary={paymentSummary}
            projects={projects}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
