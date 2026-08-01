import Link from "next/link";
import { headers } from "next/headers";

import { JobBoard } from "@/components/jobs/job-board";
import { JobService } from "@/lib/services/job-service";
import { ReferralContextService } from "@/lib/services/referral-context-service";

export const dynamic = "force-dynamic";

type JobsPageProps = {
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

function getHeaderCopy(firstName?: string) {
  if (firstName) {
    return `${firstName} invited you to apply for these roles`;
  }

  return "You were invited to apply for these roles.";
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

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const [params, headerStore] = await Promise.all([searchParams, headers()]);
  const referralCode = params.ref ?? params.referralCode;
  const lookupKey = getLookupKey(headerStore);
  const [jobs, referralContext] = await Promise.all([
    JobService.listActiveJobs(),
    ReferralContextService.getPublicContext(referralCode, lookupKey),
  ]);

  return (
    <main className="min-h-screen bg-[#f8f8ff] text-[#202235]">
      <header className="sticky top-0 z-30 h-[58px] border-b border-[#e2e4f4] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1128px] items-center justify-between px-4 lg:px-0">
          <Link
            className="text-[24px] font-black tracking-[-0.03em] text-[#05060b]"
            href="/"
          >
            micro1.
          </Link>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-full border border-[#d8dbe7] bg-white px-4 text-sm font-semibold text-[#2d3150] shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition hover:border-[#b9bee7] hover:bg-[#fbfbff] focus:outline-none focus:ring-2 focus:ring-[#e5e7fb]"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <JobBoard
        headerCopy={getHeaderCopy(referralContext?.firstName)}
        jobs={jobs}
        referralCode={referralCode}
      />
    </main>
  );
}
