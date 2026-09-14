import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { HomeDashboardClient } from "@/components/home-dashboard-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";

  return (
    <div className="flex min-h-screen bg-[#fafafc] text-slate-900">
      <PortalSidebar activeTab="home" userName={userName} avatarColor="#c2410c" />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px]">
          <HomeDashboardClient userName={userName} />
        </div>
      </main>
    </div>
  );
}
