import { PortalSidebar } from "@/components/portal-sidebar";
import { ReferralClient } from "@/components/referral-client";
import { requirePageSession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/app-url";
import { ReferralService } from "@/lib/services/referral-service";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const session = await requirePageSession("/referral");

  const userName = session.user.name || "Member";
  const referral = await ReferralService.getMyLinks(
    session.user.id,
    getAppUrl(),
  );

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="referrals"
        isAuthenticated={Boolean(session?.user?.id)}
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px]">
          <ReferralClient
            joinedCount={referral.joinedCount}
            qualifiedCount={referral.qualifiedCount}
            referralLink={referral.url}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
