import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { ApplicationForm } from "@/components/application-form";
import { buildJobDetailCopy } from "@/lib/job-detail-copy";
import { JobService } from "@/lib/services/job-service";

export const dynamic = "force-dynamic";

type ApplyPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    ref?: string;
    referralCode?: string;
  }>;
};

const ABOUT_MICRO1 = [
  "micro1 is the leading AI data lab for training frontier models and evaluating AI agents. Experts contribute their diverse subject matter knowledge across domains such as finance, healthcare, STEM engineering, and more. micro1 transforms that real-world expertise into high-quality training data, evaluations, and feedback loops that improve how AI systems learn, reason, and perform.",
  "Our platform identifies and vets top talent through an AI recruiter, enabling high-quality expert contributions at scale. We aim to enable 1 billion people to do meaningful work by applying their expertise to AI. As our global expert network grows, micro1 is building the human intelligence layer for frontier AI.",
];

function formatApplyPay(formattedHourlyPay: string | null) {
  if (!formattedHourlyPay) {
    return "Pay discussed";
  }

  return formattedHourlyPay.replace("/hr", "/hour");
}

function formatSkillLabel(label: string) {
  if (label.toLowerCase() === "crm") {
    return "CRM";
  }

  return label;
}

function listingsHref(referralCode?: string) {
  if (!referralCode) {
    return "/jobs";
  }

  return `/referral/jobs?referralCode=${encodeURIComponent(referralCode)}`;
}

function applyHref(jobId: string, referralCode?: string) {
  const href = `/jobs/${jobId}/apply`;

  if (!referralCode) {
    return href;
  }

  return `${href}?referralCode=${encodeURIComponent(referralCode)}`;
}

export default async function ApplyPage({
  params,
  searchParams,
}: ApplyPageProps) {
  const [{ jobId }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const referralCode = query.ref ?? query.referralCode;

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(applyHref(jobId, referralCode))}`,
    );
  }

  const job = await JobService.getActiveJob(jobId);

  if (!job) {
    notFound();
  }

  const detailCopy = buildJobDetailCopy(job);
  const payLabel = formatApplyPay(job.formattedHourlyPay);

  return (
    <main className="min-h-screen bg-white text-[#0f1019]">
      <div className="mx-auto grid max-w-[1050px] gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_24.25rem] lg:gap-11 lg:px-0">
        <article className="min-w-0">
          <p className="text-[30px] font-black leading-none tracking-normal text-black">
            micro1.
          </p>

          <header className="mt-7">
            <h1 className="text-[30px] font-semibold leading-tight tracking-normal text-black">
              {job.title}
            </h1>

            <div className="mt-4 inline-flex items-center rounded bg-[#f3f2fb] px-3 py-2 text-[14px] font-semibold text-[#202233]">
              <span>{payLabel}</span>
              {job.formattedHourlyPay ? (
                <span className="ml-1 text-[12px] font-normal text-[#555869]">
                  pay
                </span>
              ) : null}
            </div>
          </header>

          <section className="mt-7">
            <h2 className="text-[16px] font-semibold text-black">
              Required Skills
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span
                  className="rounded bg-[#eeeef6] px-3 py-2 text-[14px] leading-none text-[#272936]"
                  key={skill.id}
                >
                  {formatSkillLabel(skill.label)}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-md bg-[#f2f1fb] px-4 py-4 text-[12px] leading-[1.45] text-[#303241] sm:px-5">
            <h2 className="text-[14px] font-semibold text-black">
              About micro1
            </h2>
            <div className="mt-2 space-y-3">
              {ABOUT_MICRO1.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mt-9 max-w-[650px] text-[15px] leading-[1.55] text-black">
            <div className="space-y-7">
              <p>
                <span className="font-medium">Role Title:</span> {job.title}
              </p>
              <p>
                <span className="font-medium">Role Type:</span> Contractor
              </p>
              <p>
                <span className="font-medium">Location:</span> Remote
              </p>
            </div>

            <p className="mt-7">{detailCopy.intro}</p>

            <section className="mt-7">
              <h2 className="font-medium">Scope of Work</h2>
              <ul className="mt-1 list-disc space-y-1 pl-7">
                {detailCopy.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-7">
              <h2 className="font-medium">Preferred Qualifications</h2>
              <ul className="mt-1 list-disc space-y-1 pl-7">
                {detailCopy.qualifications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {detailCopy.note ? <p className="mt-7">{detailCopy.note}</p> : null}
          </section>
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ApplicationForm
            applicantEmail={session.user.email ?? ""}
            jobId={job.id}
            listingsHref={listingsHref(referralCode)}
          />
        </aside>
      </div>
    </main>
  );
}
