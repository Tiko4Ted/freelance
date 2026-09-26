import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { ReferralClient } from "@/components/referral-client";
import { ReferralService } from "@/lib/services/referral-service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DEFAULT_APP_URL = "https://freelance-nu-swart.vercel.app";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    DEFAULT_APP_URL
  );
}

export default async function ReferralPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Freferral");
  }

  const userName = session.user.name || "Member";
  const referral = await ReferralService.getMyLinks(
    session.user.id,
    appUrl(),
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
            referralLink={referral.url}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
