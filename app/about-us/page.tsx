import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  FileCheck2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";

export const metadata: Metadata = {
  title: "About Trinity-AI",
  description:
    "A detailed explanation of the Trinity-AI project, its solution, and its goals.",
};

const principles = [
  {
    title: "Clear opportunity",
    body: "People should understand what work is available, what is expected, and what progress means before they invest their time.",
  },
  {
    title: "Verified effort",
    body: "Hours, tasks, and review states are recorded so progress can be seen instead of guessed.",
  },
  {
    title: "Accountable payment",
    body: "Money moves through a wallet and ledger model so balances, awaiting payments, and withdrawals can be checked from one place.",
  },
];

const goals = [
  "Help capable workers find structured freelance work without needing an insider connection.",
  "Give referrers a simple way to introduce candidates while preserving attribution.",
  "Make project progress easier to review by tying work, hours, submissions, and payout eligibility together.",
  "Separate quick dashboard summaries from full wallet details, so users see what matters without losing access to the complete record.",
  "Build toward a system where every important action has a clear status and an auditable trail.",
];

export default async function AboutUsPage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="home"
        userName={userName}
      />
      <main className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-[1120px] px-5 py-8 md:px-10 md:py-12">
          <div className="mb-8">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-muted transition hover:text-brand-gold-strong"
              href="/home"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>

          <header className="grid gap-8 border-b border-brand-sand pb-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-brand-gold-strong">
                About Trinity-AI
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-brand-ink md:text-6xl">
                A work platform built around trust, progress, and fair payment.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-brand-muted">
                Trinity-AI is designed to connect people with project-based
                freelance work while keeping the important records in one place:
                applications, tasks, hours worked, wallet balances, referral
                activity, and payout status.
              </p>
            </div>

            <div className="border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
              <div className="flex items-center gap-3 border-b border-brand-sand pb-4">
                <BookOpen className="h-5 w-5 text-brand-gold-strong" />
                <p className="font-semibold text-brand-ink">
                  A simple reading guide
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-brand-muted">
                Think of the platform like a school record book for freelance
                work. It does not only say who joined. It also tracks the class,
                the assignment, the submitted work, the review, and the payment
                record.
              </p>
            </div>
          </header>

          <section className="grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-8 lg:h-fit">
              <p className="text-sm font-semibold text-brand-gold-strong">
                The problem
              </p>
            </aside>
            <div className="space-y-6 text-[17px] leading-8 text-brand-muted">
              <p>
                Many freelance systems fail at the same point: the work may be
                real, but the process feels unclear. A person applies, waits,
                completes a task, logs time, and then wonders what is happening
                with payment. That uncertainty is expensive. It costs the worker
                confidence, and it costs the organization time because every
                unclear process creates support questions.
              </p>
              <p>
                Trinity-AI addresses that problem by organizing the journey
                around visible records. A user should be able to answer basic
                questions without needing an explanation from an administrator:
                What have I applied for? What work is active? How many hours are
                recorded? What payment is waiting? Where do I see the full
                wallet and account history?
              </p>
            </div>
          </section>

          <section className="border-y border-brand-sand py-10">
            <div className="grid gap-5 md:grid-cols-3">
              {principles.map((principle) => (
                <div className="border border-brand-sand bg-brand-ivory p-5 shadow-brand-card" key={principle.title}>
                  <CheckCircle2 className="h-5 w-5 text-brand-gold-strong" />
                  <h2 className="mt-4 text-lg font-semibold text-brand-ink">
                    {principle.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-brand-muted">
                    {principle.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-brand-ink">
                  The solution in plain language
                </h2>
                <p className="mt-5 text-[17px] leading-8 text-brand-muted">
                  The platform turns freelance participation into a sequence of
                  understandable states. First, a person applies for a role.
                  Then the system records whether the application is pending,
                  certified, matched, active, eligible for payout, paid, or
                  closed. Those words matter because they reduce confusion. A
                  status is a public promise about where the work stands.
                </p>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold text-brand-ink">
                    1. Applications create the work record
                  </h3>
                  <p className="mt-3 text-[17px] leading-8 text-brand-muted">
                    An application is more than a form. It is the first official
                    record connecting a person to a role. It stores the role,
                    candidate details, assessment results, and the first status
                    of the journey. For a beginner, this means the platform is
                    not simply collecting information; it is opening a tracked
                    pathway into work.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-brand-ink">
                    2. Tasks and hours make progress measurable
                  </h3>
                  <p className="mt-3 text-[17px] leading-8 text-brand-muted">
                    Work becomes easier to trust when it can be measured. The
                    platform records completed tasks and hours worked so the
                    worker and the reviewer can speak from the same evidence.
                    This is why the home payments area now focuses on the two
                    numbers most useful at a glance: hours worked and awaiting
                    payment.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-brand-ink">
                    3. The wallet keeps the full financial story
                  </h3>
                  <p className="mt-3 text-[17px] leading-8 text-brand-muted">
                    The home page should not overwhelm users with every account
                    detail. It should summarize. The wallet page carries the
                    deeper record: holding balance, funding balance, ledger
                    history, withdrawals, and account movement. In simple terms,
                    home tells you what to notice; wallet tells you what
                    happened.
                  </p>
                </section>
              </div>
            </div>

            <aside className="h-fit border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
              <h2 className="text-lg font-semibold text-brand-ink">
                How the record fits together
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  {
                    icon: FileCheck2,
                    title: "Apply",
                    text: "A user chooses a role and creates a candidate record.",
                  },
                  {
                    icon: Clock3,
                    title: "Work",
                    text: "Tasks and hours turn activity into measurable progress.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Review",
                    text: "Eligibility and verification protect the worker and the platform.",
                  },
                  {
                    icon: Wallet,
                    title: "Wallet",
                    text: "Balances and ledger entries preserve the payment history.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className="grid grid-cols-[36px_1fr] gap-3 border border-brand-sand bg-brand-canvas/60 p-3"
                      key={item.title}
                    >
                      <div className="flex h-9 w-9 items-center justify-center bg-[#f2e8d7] text-brand-gold-strong">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-ink">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-brand-muted">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </section>

          <section className="grid gap-8 border-t border-brand-sand py-12 lg:grid-cols-[260px_1fr]">
            <aside>
              <p className="text-sm font-semibold text-brand-gold-strong">
                Project goals
              </p>
            </aside>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-brand-ink">
                What the project is trying to make possible
              </h2>
              <div className="mt-6 divide-y divide-brand-sand border-y border-brand-sand">
                {goals.map((goal) => (
                  <div className="flex gap-4 py-4" key={goal}>
                    <Compass className="mt-1 h-5 w-5 shrink-0 text-brand-gold-strong" />
                    <p className="text-[17px] leading-7 text-brand-muted">
                      {goal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border border-brand-gold/30 bg-brand-ink p-6 text-brand-ivory shadow-brand-card md:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              The guiding idea
            </h2>
            <p className="mt-4 max-w-3xl text-[17px] leading-8 text-brand-ivory/75">
              A strong freelance platform should make opportunity feel less
              mysterious. It should teach users where they are in the process,
              show the records that matter, and keep payment information aligned
              with the work that produced it. That is the long-term goal of
              Trinity-AI: a clearer bridge between people who can do valuable
              work and the systems that need that work done.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
