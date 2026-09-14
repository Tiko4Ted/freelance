import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { HomeDashboardClient } from "@/components/home-dashboard-client";
import { prisma } from "@/lib/db/prisma";
import { LedgerService } from "@/lib/services/ledger-service";

export const dynamic = "force-dynamic";

function formatHoursWorked(hours: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(hours);
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

  return (
    <div className="flex min-h-screen bg-[#fafafc] text-slate-900">
      <PortalSidebar activeTab="home" userName={userName} avatarColor="#c2410c" />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px]">
          <HomeDashboardClient
            paymentSummary={paymentSummary}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
