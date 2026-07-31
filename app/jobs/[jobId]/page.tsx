import { notFound } from "next/navigation";

import { JobDetailContent } from "@/components/jobs/job-detail-content";
import { JobDetailShell } from "@/components/jobs/job-detail-shell";
import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

function closeHref(referralCode?: string) {
  if (!referralCode) {
    return "/jobs";
  }

  return `/referral/jobs?referralCode=${encodeURIComponent(referralCode)}`;
}

export default async function JobDetailPage({
  params,
  searchParams,
}: JobDetailPageProps) {
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const referralCode = query.ref ?? query.referralCode;
  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  return (
    <JobDetailShell closeHref={closeHref(referralCode)}>
      <JobDetailContent job={job} />
    </JobDetailShell>
  );
}
