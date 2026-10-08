import { PortalSidebar } from "@/components/portal-sidebar";
import { OnboardingFlowClient } from "@/components/onboarding-flow-client";
import { requirePageSession } from "@/lib/auth/session";
import {
  OnboardingService,
  emptyOnboardingStatus,
} from "@/lib/services/onboarding-service";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requirePageSession("/onboarding");
  const userName = session?.user?.name || "Teddy";
  const onboarding = session?.user?.id
    ? await OnboardingService.getStatus(session.user.id)
    : emptyOnboardingStatus();

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="onboarding"
        isAuthenticated={Boolean(session?.user?.id)}
        userName={userName}
      />
    <main className="relative flex-1 overflow-y-auto px-4 pb-8 pt-24 sm:px-6 md:px-12 md:pb-10 md:pt-28 lg:pl-64">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(200,164,93,0.12),_transparent_68%)]" />
      <div className="relative mx-auto max-w-[880px]">
        <OnboardingFlowClient
            initialOnboarding={onboarding}
            isAuthenticated={Boolean(session?.user?.id)}
            userName={userName}
          />
        </div>
      </main>
    </div>
  );
}
