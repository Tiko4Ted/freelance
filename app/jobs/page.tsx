import Link from "next/link";
import { headers } from "next/headers";
import { Search } from "lucide-react";

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
        <div className="mx-auto flex h-full max-w-[1128px] items-center px-4 lg:px-0">
          <Link
            className="text-[24px] font-black tracking-[-0.03em] text-[#05060b]"
            href="/"
          >
            micro1.
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#dfe2f5]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(248,248,255,0.92)_76%,#f8f8ff_100%),radial-gradient(ellipse_at_47%_10%,rgba(93,117,142,0.34)_0%,rgba(93,117,142,0.15)_23%,transparent_45%),radial-gradient(ellipse_at_53%_14%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.28)_16%,transparent_32%),linear-gradient(135deg,#e7f0f8_0%,#d8e3ed_34%,#f3f5fb_68%,#eef0fb_100%)]" />
        <div className="relative mx-auto min-h-[178px] max-w-[1128px] px-4 pt-[35px] lg:px-0">
          <div className="flex items-start justify-between gap-6">
            <h1 className="max-w-[760px] text-[28px] font-semibold leading-[1.18] tracking-[-0.015em] text-[#090b12]">
              {getHeaderCopy(referralContext?.firstName)}
            </h1>
            <button
              aria-label="Search jobs"
              className="mt-[-6px] hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dde1ee] bg-white text-[#4b5160] shadow-[0_4px_14px_rgba(37,44,70,0.08)] md:flex"
              type="button"
            >
              <Search aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      <div className="-mt-[1px]">
        <JobBoard jobs={jobs} referralCode={referralCode} />
      </div>
    </main>
  );
}
