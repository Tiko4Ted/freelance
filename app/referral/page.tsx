import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { ReferralClient } from "@/components/referral-client";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";
  const userId = session?.user?.id || "teddy123";

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="referrals"
        isAuthenticated={Boolean(session?.user?.id)}
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px]">
          <ReferralClient userName={userName} referralCode={userId} />
        </div>
      </main>
    </div>
  );
}
