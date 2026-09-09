import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { OnboardingFlowClient } from "@/components/onboarding-flow-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";

  return (
    <div className="flex min-h-screen bg-[#fafafc] text-slate-900">
      <PortalSidebar
        activeTab="onboarding"
        userName={userName}
        avatarColor="#c2410c"
      />
      <main className="flex-1 overflow-y-auto px-6 py-10 md:px-12">
        <div className="mx-auto max-w-[800px]">
          <OnboardingFlowClient userName={userName} />
        </div>
      </main>
    </div>
  );
}
