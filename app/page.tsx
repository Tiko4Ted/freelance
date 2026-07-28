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

const demoJobs = [
  "Senior Full-Stack Engineer",
  "AI Workflow Automation Specialist",
  "Product Designer",
  "Data Engineer",
  "One-Task Security Reviewer",
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
              <Link
                className="inline-flex h-11 items-center justify-center border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
                href="/admin"
              >
                Admin
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

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Demo jobs</h2>
          <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-white">
            {demoJobs.map((job) => (
              <div
                className="flex items-center justify-between gap-4 px-5 py-4"
                key={job}
              >
                <span className="text-sm font-medium text-slate-900">
                  {job}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Seeded
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Build checkpoint
          </h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Framework</dt>
              <dd className="font-medium text-slate-950">Next.js 14</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Database</dt>
              <dd className="font-medium text-slate-950">PostgreSQL</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">ORM</dt>
              <dd className="font-medium text-slate-950">Prisma</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-teal-700">Foundation</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
