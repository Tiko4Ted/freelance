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
    <main className="min-h-screen bg-[#f3f6ff] text-[#202235]">
      <section className="relative overflow-hidden border-b border-[#d9def7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.9),transparent_28%),linear-gradient(135deg,#eaf7ff_0%,#f8fbff_46%,#eef1ff_100%)]" />
        <div className="absolute left-1/2 top-0 h-44 w-[42rem] -translate-x-1/2 rounded-b-[50%] bg-[#dbe7ff]/70 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <Link className="text-lg font-black tracking-tight text-[#111427]" href="/">
              micro1
            </Link>
            <Link
              className="rounded-full border border-[#cfd7ff] bg-white/80 px-4 py-2 text-sm font-semibold text-[#3f4665] transition hover:border-[#727bff] hover:text-[#262cff]"
              href="/dashboard"
            >
              Referrer dashboard
            </Link>
          </nav>

          <div className="mx-auto max-w-5xl py-10 sm:py-14">
            <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-[#111427] sm:text-5xl">
              {getHeaderCopy(referralContext?.firstName)}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f687f]">
              Browse remote contract roles, review required skills, and apply
              to the projects that match your background.
            </p>
          </div>
        </div>
      </section>

      <div className="-mt-6">
        <JobBoard jobs={jobs} referralCode={referralCode} />
      </div>
    </main>
  );
}
