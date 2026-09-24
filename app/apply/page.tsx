import { headers } from "next/headers";
import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { JobBoard } from "@/components/jobs/job-board";
import { JobService } from "@/lib/services/job-service";
import { ReferralContextService } from "@/lib/services/referral-context-service";

export const dynamic = "force-dynamic";

type ApplyPageProps = {
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

function getHeaderCopy(firstName?: string) {
  if (firstName) {
    return `${firstName} invited you to apply for these roles`;
  }

  return "Apply to Jobs";
}

function getLookupKey(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ??
    headerStore.get("x-real-ip") ??
    headerStore.get("cf-connecting-ip") ??
    "anonymous"
  );
}

export default async function ApplyPage({ searchParams }: ApplyPageProps) {
  const [params, headerStore, session] = await Promise.all([
    searchParams,
    headers(),
    auth(),
  ]);

  const referralCode = params.ref ?? params.referralCode;
  const lookupKey = getLookupKey(headerStore);
  const [jobs, referralContext] = await Promise.all([
    JobService.listActiveJobs(),
    ReferralContextService.getPublicContext(referralCode, lookupKey),
  ]);

  const userName = session?.user?.name || "Tiko";

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      {/* Side Menu */}
      <PortalSidebar
        activeTab="apply"
        isAuthenticated={Boolean(session?.user?.id)}
        userName={userName}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        <JobBoard
          headerCopy={getHeaderCopy(referralContext?.firstName)}
          jobs={jobs}
          referralCode={referralCode}
        />
      </main>
    </div>
  );
}
