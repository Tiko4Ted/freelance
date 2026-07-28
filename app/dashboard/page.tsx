import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ReferralService } from "@/lib/services/referral-service";

export const dynamic = "force-dynamic";

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const origin = await getOrigin();
  const [referrals, applications] = await Promise.all([
    ReferralService.getMyLinks(session.user.id, origin),
    ReferralService.getMyApplications(session.user.id),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 md:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <Link className="text-sm font-medium text-teal-700" href="/">
              ReferralJobs
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center border border-slate-950 px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
              href="/jobs"
            >
              Jobs
            </Link>
          </nav>
          <div>
            <p className="text-sm font-medium text-slate-500">
              {session.user.email}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 md:text-5xl">
              Referrer dashboard
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[1fr_20rem] md:px-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Referral links
          </h2>
          <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-white">
            {referrals.links.map((link) => (
              <article className="p-5" key={link.job.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {link.job.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {link.job.formattedPayout}, {link.job.payoutTriggerLabel}
                    </p>
                  </div>
                  <Link
                    className="inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
                    href={link.url}
                  >
                    Open link
                  </Link>
                </div>
                <input
                  className="mt-4 h-10 w-full border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
                  readOnly
                  value={link.url}
                />
              </article>
            ))}
          </div>
        </div>

        <aside className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">Code</h2>
          <p className="mt-3 break-all text-2xl font-semibold text-teal-700">
            {referrals.referralCode}
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Links</dt>
              <dd className="font-medium text-slate-950">
                {referrals.links.length}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Applications</dt>
              <dd className="font-medium text-slate-950">
                {applications.length}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
        <h2 className="text-xl font-semibold text-slate-950">
          Referred applications
        </h2>
        <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-white">
          {applications.length ? (
            applications.map((item) => (
              <article
                className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"
                key={item.id}
              >
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {item.application?.candidateName ?? "Pending application"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.job.title}
                  </p>
                </div>
                <p className="text-sm font-semibold text-teal-700">
                  {item.application?.status ?? "CLICKED"}
                </p>
              </article>
            ))
          ) : (
            <p className="p-5 text-sm text-slate-600">No referrals yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
