import Link from "next/link";

const workstreams = [
  {
    name: "Referral Capture",
    value: "First touch",
    detail: "Cookie attribution locked before application submission",
  },
  {
    name: "Payout Ledger",
    value: "Append only",
    detail: "Wallet balances reconcile from immutable ledger entries",
  },
  {
    name: "Withdrawals",
    value: "Idempotent",
    detail: "Provider payouts use withdrawal IDs as retry keys",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Get your link",
    detail: "Every referrer gets a unique code appended to each job's URL.",
  },
  {
    step: "02",
    title: "Candidate applies",
    detail:
      "Attribution locks to whichever link the candidate clicked first, before they ever apply.",
  },
  {
    step: "03",
    title: "Get paid",
    detail:
      "Once the candidate clears the payout threshold, the locked amount lands in your wallet.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
                ReferralJobs
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">
                Referral hiring with locked attribution and auditable payouts.
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center border border-slate-950 bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700"
                href="/jobs"
              >
                View jobs
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
                href="/dashboard"
              >
                Dashboard
              </Link>
            </div>
          </nav>
          <div className="grid gap-4 md:grid-cols-3">
            {workstreams.map((stream) => (
              <article
                className="border border-slate-200 bg-slate-50 p-5"
                key={stream.name}
              >
                <p className="text-sm font-medium text-slate-500">
                  {stream.name}
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {stream.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {stream.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-950">
            How it works
          </h2>
          <Link
            className="text-sm font-semibold text-teal-700 hover:underline"
            href="/jobs"
          >
            View open roles →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {howItWorks.map((item) => (
            <article
              className="border border-slate-200 bg-white p-5"
              key={item.step}
            >
              <p className="text-sm font-semibold text-teal-700">
                {item.step}
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
