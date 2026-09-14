import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import {
  BadgeCheck,
  BookOpen,
  ChevronRight,
  CreditCard,
  FileQuestion,
  LifeBuoy,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

const helpTopics = [
  {
    title: "Getting started",
    description: "Finish onboarding, confirm your account, and find open work.",
    icon: BadgeCheck,
    articles: ["Complete onboarding", "Apply for a role", "Track review status"],
  },
  {
    title: "Projects and tasks",
    description: "Understand task states, submissions, reviews, and approvals.",
    icon: BookOpen,
    articles: ["Submit work", "Fix returned work", "View project history"],
  },
  {
    title: "Payments",
    description: "Review expected earnings, wallet balances, and withdrawals.",
    icon: CreditCard,
    articles: ["Expected earnings", "Transfer funds", "Request withdrawal"],
  },
  {
    title: "Account safety",
    description: "Manage identity checks, account access, and verification.",
    icon: ShieldCheck,
    articles: ["Verify identity", "Secure your login", "Report account issue"],
  },
];

const popularArticles = [
  "Why are earnings marked as expected?",
  "How long does onboarding review take?",
  "Where do I see completed hours?",
  "What happens after I submit a task?",
  "How do I update my payout method?",
];

export default async function HelpCenterPage() {
  const session = await auth();
  const userName = session?.user?.name || "Teddy";

  return (
    <div className="flex min-h-screen bg-[#fafafc] text-slate-900">
      <PortalSidebar activeTab="help" userName={userName} avatarColor="#c2410c" />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px] space-y-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-950 px-6 py-8 text-white md:px-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <LifeBuoy className="h-5 w-5 text-blue-200" />
                  </div>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
                    How can we help?
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    Search guides for onboarding, projects, payments, and account
                    support.
                  </p>
                </div>
                <a
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
                  href="mailto:support@afterquery.com"
                >
                  <Mail className="h-4 w-4" />
                  Email support
                </a>
              </div>

              <label className="mt-7 flex h-14 items-center gap-3 rounded-2xl bg-white px-4 text-slate-900 shadow-lg">
                <Search className="h-5 w-5 shrink-0 text-slate-400" />
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search help articles"
                  type="search"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 md:p-6">
              {helpTopics.map((topic) => {
                const TopicIcon = topic.icon;

                return (
                  <section
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                    key={topic.title}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <TopicIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          {topic.title}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {topic.articles.map((article) => (
                        <a
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
                          href="#contact-support"
                          key={article}
                        >
                          {article}
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Popular articles
                  </h2>
                  <p className="text-sm text-slate-500">
                    Fast answers to common support questions.
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-slate-200/80">
                {popularArticles.map((article) => (
                  <a
                    className="flex items-center justify-between py-4 text-sm font-semibold text-slate-800 transition hover:text-blue-700"
                    href="#contact-support"
                    key={article}
                  >
                    {article}
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </a>
                ))}
              </div>
            </section>

            <section
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm"
              id="contact-support"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Contact support
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tell us what happened, the project name, and any payment or
                task details you expected to see.
              </p>
              <div className="mt-5 space-y-3">
                <a
                  className="flex h-11 items-center justify-center rounded-xl bg-[#0066cc] px-4 text-sm font-semibold text-white transition hover:bg-[#0052a3]"
                  href="mailto:support@afterquery.com"
                >
                  Email support
                </a>
                <a
                  className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  href="/home"
                >
                  Back to home
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
