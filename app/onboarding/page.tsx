import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { OnboardingFlowClient } from "@/components/onboarding-flow-client";
import {
  OnboardingService,
  emptyOnboardingStatus,
} from "@/lib/services/onboarding-service";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";
  const onboarding = session?.user?.id
    ? await OnboardingService.getStatus(session.user.id)
    : emptyOnboardingStatus();

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="onboarding"
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12">
        <div className="mx-auto max-w-[800px]">
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
