import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationForm } from "@/components/application-form";
import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

const REFERRAL_COOKIE_NAME = "ref_code";

type ApplyPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

function withReferral(href: string, referralCode?: string) {
  if (!referralCode) {
    return href;
  }

  return `${href}?referralCode=${encodeURIComponent(referralCode)}`;
}

export default async function ApplyPage({
  params,
  searchParams,
}: ApplyPageProps) {
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const referralCode = query.ref ?? query.referralCode;
  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  const cookieStore = await cookies();
  const referralCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  const referralDetected = Boolean(
    (referralCookie && referralCookie.startsWith(`${job.id}:`)) ||
      referralCode,
  );

  return (
    <main className="min-h-screen bg-[#f3f6ff] text-[#202235]">
      <section className="border-b border-[#d9def7] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            className="text-sm font-semibold text-[#626cff]"
            href={withReferral(`/jobs/${job.id}`, referralCode)}
          >
            {job.title}
          </Link>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#111427] sm:text-5xl">
            Candidate application
          </h1>
          <p className="mt-3 text-base text-[#5f687f]">
            Pay: {job.formattedHourlyPay ?? "discussed during review"}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {referralDetected ? (
          <div className="mb-5 rounded-md border border-[#a8e3d8] bg-[#e8faf6] p-4 text-sm font-semibold text-[#096d5e]">
            Invitation detected. Continue with your application below.
          </div>
        ) : null}
        <div className="rounded-md border border-[#cfd7ff] bg-white p-5">
          <ApplicationForm jobId={job.id} />
        </div>
      </section>
    </main>
  );
}
