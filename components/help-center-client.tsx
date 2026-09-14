"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Mail, Search, Send } from "lucide-react";

type Article = {
  category: string;
  title: string;
  summary: string;
  body: string[];
};

const categories = [
  "Getting Started",
  "Fellowship Expectations",
  "Project Participation",
  "Policies",
  "Payments",
];

const sidebarGroups = [
  {
    title: "Getting Started",
    items: [
      "Age requirement",
      "Program overview",
      "Getting started",
      "Sign up",
      "Post-application",
      "Identity verification",
      "Phone verification",
      "Troubleshoot verification",
      "Background check",
      "Background check FAQs",
      "Verification issues",
      "What to expect",
    ],
  },
  {
    title: "Fellowship Expectations",
    items: [
      "Work quality",
      "Staying safe",
      "Communication",
      "Availability",
      "Account standing",
    ],
  },
  {
    title: "Project Participation",
    items: [
      "Project matching",
      "Submitting work",
      "Returned work",
      "Project reviews",
      "Ending a project",
    ],
  },
  {
    title: "Policies",
    items: ["Code of conduct", "Data handling", "Account security"],
  },
  {
    title: "Payments",
    items: ["Expected earnings", "Wallet", "Withdrawals", "Payment delays"],
  },
];

const articles: Article[] = [
  {
    category: "Getting Started",
    title: "Introduction to the AfterQuery AI program",
    summary:
      "A practical overview of how flexible project-based AI work runs on AfterQuery.",
    body: [
      "AfterQuery connects qualified contributors with remote projects that evaluate, improve, and operate AI systems. Most people begin by creating an account, completing onboarding, and waiting for project matching.",
      "Your dashboard shows required tasks, applications, total hours, expected earnings, and support shortcuts. Complete each required verification step before applying for projects with stricter client requirements.",
      "When you are ready to work, use the Apply page to review available roles and follow the project instructions shown there.",
    ],
  },
  {
    category: "Getting Started",
    title: "Age requirement",
    summary: "Who can create an account and participate in AfterQuery work.",
    body: [
      "You must be old enough to enter a work agreement in your location and satisfy any project-specific eligibility rules before accepting tasks.",
      "Some projects may require additional checks based on client, country, payment, or safety requirements. If a requirement appears in onboarding, complete it before submitting work.",
      "If your legal name, date of birth, or location changes during review, contact support before creating another account.",
    ],
  },
  {
    category: "Getting Started",
    title: "Getting started",
    summary: "The shortest path from account creation to your first project.",
    body: [
      "Create your account, complete legal documents, verify your phone, verify your identity, and add payout details when prompted.",
      "After onboarding, review open roles from Apply. Read the full project card before submitting an application because each client can have different requirements.",
      "Keep notifications enabled for the email and phone number on your account so you do not miss a review update.",
    ],
  },
  {
    category: "Getting Started",
    title: "Sign up",
    summary: "How to create an AfterQuery account and avoid duplicate profiles.",
    body: [
      "Use one email address and one phone number for your account. Duplicate profiles can slow down verification and may block project access.",
      "Enter your legal name exactly as it appears on the identity document you plan to use for verification.",
      "If you already have an account but cannot sign in, use support instead of creating a second account.",
    ],
  },
  {
    category: "Getting Started",
    title: "Next steps after applying to a project",
    summary: "What happens after you apply and how to track review progress.",
    body: [
      "After you apply, your application can move through review, certification, matching, and active project states.",
      "Use the home page for status summaries and the Apply page for open roles. If your status has not changed, continue checking the task card and the email tied to your account.",
      "If the displayed status conflicts with a client message, contact support with the project name and the date of the message.",
    ],
  },
  {
    category: "Getting Started",
    title: "Identity verification",
    summary: "Why identity review is required and how to complete it cleanly.",
    body: [
      "Identity verification protects contributors, clients, and payment records. Complete it from the onboarding flow only.",
      "Use a clear, valid document and make sure the name on your account matches the document. Blurry images, cropped documents, and mismatched names can cause delays.",
      "If verification fails, review the reason shown in the app before retrying. Contact support if the issue repeats.",
    ],
  },
  {
    category: "Getting Started",
    title: "Phone verification",
    summary: "How phone verification works after signing legal documents.",
    body: [
      "After legal signing is complete, continue to phone verification from onboarding. The phone step displays the number on your account and sends a verification code.",
      "Enter the code before it expires. If you do not receive it, confirm the number is correct, check signal strength, and wait before requesting another code.",
      "Use a phone number you control. Shared or temporary numbers can fail account review.",
    ],
  },
  {
    category: "Getting Started",
    title: "Troubleshoot verification",
    summary: "What to do when phone, identity, or account verification stalls.",
    body: [
      "Refresh the onboarding page and confirm the previous step is marked complete before starting the next one.",
      "For phone issues, check the country code and SMS access. For identity issues, use a supported document with clear lighting.",
      "If the same error appears twice, contact support with the step name, the error text, and the email on your account.",
    ],
  },
  {
    category: "Getting Started",
    title: "Background check",
    summary: "When a background check may be required.",
    body: [
      "Some client projects require a background check before access is granted. If required, the onboarding flow will show the step and any instructions you need to follow.",
      "Complete the check using your own legal information. Results and timing depend on the provider and your location.",
      "Do not start client work that requires a background check until the app shows the requirement is complete.",
    ],
  },
  {
    category: "Getting Started",
    title: "Background check FAQs",
    summary: "Common questions about background check timing and status.",
    body: [
      "Most delays happen when information is missing, inaccurate, or waiting on an external source. Check the instructions shown during the step before opening a ticket.",
      "A completed background check does not guarantee a specific project. It only means the requirement is cleared for roles that use that check.",
      "If the status has not changed after the displayed review window, contact support with the submission date.",
    ],
  },
  {
    category: "Getting Started",
    title: "Verification issues",
    summary: "How to report repeated verification errors.",
    body: [
      "Capture the exact error text, note which step failed, and confirm whether you already retried.",
      "Do not submit different names, documents, or phone numbers to force approval. That can create account review conflicts.",
      "Support can help investigate repeated failures when you provide the account email, step name, and time of the latest attempt.",
    ],
  },
  {
    category: "Getting Started",
    title: "What to expect",
    summary: "A quick timeline for onboarding, applying, and working.",
    body: [
      "First you complete onboarding. Then you apply for work. After review, matched projects appear with instructions, deadlines, and payment details.",
      "Availability changes by client demand, eligibility, and project capacity. A quiet dashboard usually means there is no matching work available right now.",
      "Keep your account details current so project and payment updates reach you without delay.",
    ],
  },
  {
    category: "Fellowship Expectations",
    title: "Work authorization and eligibility",
    summary: "What to check before accepting work on AfterQuery.",
    body: [
      "Project eligibility can depend on your location, identity verification, client requirements, and task availability.",
      "If a project has additional requirements, complete them before submitting work. Missing requirements can delay review or payment.",
      "Keep your account details accurate so support can help when a review or payment record needs investigation.",
    ],
  },
  {
    category: "Fellowship Expectations",
    title: "Work quality",
    summary: "How to keep submissions review-ready.",
    body: [
      "Read the project instructions before starting and compare your final submission against every requirement before sending it.",
      "High-quality work is complete, original, relevant to the task, and formatted the way the project asks.",
      "If you are unsure about a requirement, ask before submitting rather than guessing and risking returned work.",
    ],
  },
  {
    category: "Fellowship Expectations",
    title: "Getting started and staying safe",
    summary:
      "How to recognize official workflow steps and avoid risky requests.",
    body: [
      "Use the in-app onboarding flow for legal documents, phone verification, identity verification, and payment setup.",
      "AfterQuery will not ask you to move payment setup to unverified channels. Keep project details, files, and payment questions inside approved workflows.",
      "If something feels suspicious, pause before submitting personal information and contact support from this page.",
    ],
  },
  {
    category: "Fellowship Expectations",
    title: "Communication",
    summary: "How to keep project communication clear and traceable.",
    body: [
      "Use approved project channels and include the project name when asking a question.",
      "Keep messages specific. Mention the task, what you tried, what happened, and what you need next.",
      "Do not share confidential project details outside the authorized workflow.",
    ],
  },
  {
    category: "Fellowship Expectations",
    title: "Availability",
    summary: "How project availability and your schedule work together.",
    body: [
      "Projects can open, pause, or close based on client demand. Seeing no available tasks does not mean your account is broken.",
      "Apply only for work you can complete within the stated timeline. Missed deadlines can affect future matching.",
      "If a project pauses, watch the home page for status changes before starting new work on that assignment.",
    ],
  },
  {
    category: "Fellowship Expectations",
    title: "Account standing",
    summary: "What can affect access to future projects.",
    body: [
      "Account standing can be affected by missing verification steps, repeated late work, policy violations, or unresolved payment and identity checks.",
      "Follow project instructions, protect sensitive data, and respond to support requests when they need more information.",
      "If access changes unexpectedly, contact support with the project name and the date you noticed the change.",
    ],
  },
  {
    category: "Project Participation",
    title: "Project matching",
    summary: "Why you may or may not see a specific project.",
    body: [
      "Matching depends on eligibility, project capacity, required skills, location, verification status, and client requirements.",
      "The Apply page shows roles available to your account. New opportunities can appear as projects open or capacity changes.",
      "If you were invited to a project but cannot see it, send support the invitation details and account email.",
    ],
  },
  {
    category: "Project Participation",
    title: "Submitting project work",
    summary: "How to send files or notes so reviewers can process your task.",
    body: [
      "Follow the project instructions exactly and include required files, notes, or metadata before submitting.",
      "A task can be returned if files are missing, unreadable, or do not match the project brief. Returned tasks should be corrected before resubmission.",
      "Keep a copy of submitted work until the task is reviewed and your payment record updates.",
    ],
  },
  {
    category: "Project Participation",
    title: "Returned work",
    summary: "What returned work means and how to fix it.",
    body: [
      "Returned work usually means the reviewer needs a correction before approval. It is not always a rejection.",
      "Read the return note carefully, make the requested changes, and resubmit within the allowed window.",
      "If the return note is unclear, contact support with the project name and the exact review note.",
    ],
  },
  {
    category: "Project Participation",
    title: "Project reviews",
    summary: "How review status affects hours and payment timing.",
    body: [
      "Submitted work may need client or quality review before hours and earnings become final.",
      "Expected earnings can appear before a withdrawal is available. Final payment depends on approval, eligibility, and payout setup.",
      "If a review takes longer than the project guidance says, contact support with the submission date.",
    ],
  },
  {
    category: "Project Participation",
    title: "Ending a project",
    summary: "What to do when a project finishes, pauses, or no longer fits.",
    body: [
      "Finish any assigned work you accepted and follow the project closeout instructions shown in the app.",
      "If you need to stop participating, communicate early and do not leave active tasks unfinished.",
      "Completed project records remain visible through your dashboard or wallet history when payments are attached.",
    ],
  },
  {
    category: "Policies",
    title: "Code of conduct",
    summary: "The behavior expected from everyone using AfterQuery.",
    body: [
      "Be respectful, truthful, and professional in account details, project communication, and submitted work.",
      "Do not harass others, impersonate another person, submit another person's work, or bypass project rules.",
      "Policy violations can lead to removed work access or account review.",
    ],
  },
  {
    category: "Policies",
    title: "Data handling",
    summary: "How to protect project information and client materials.",
    body: [
      "Use project materials only for the assigned work. Do not download, publish, reuse, or share data unless the project instructions allow it.",
      "Keep confidential information out of personal notes, public tools, and unapproved storage locations.",
      "Report accidental exposure or suspicious access requests to support as soon as you notice them.",
    ],
  },
  {
    category: "Policies",
    title: "Account security",
    summary: "How to protect your login and payment information.",
    body: [
      "Use a strong password and do not share login credentials, identity documents, verification codes, or payout details with anyone.",
      "Be careful with links that claim to be urgent payment or identity checks. Open AfterQuery directly and use the in-app flow.",
      "If you think someone accessed your account, contact support and change your password immediately.",
    ],
  },
  {
    category: "Payments",
    title: "Expected earnings and wallet timing",
    summary: "Why earnings can appear before they are available to withdraw.",
    body: [
      "Expected earnings reflect work or hours recorded for review. They can remain pending until eligibility, review, and account checks are complete.",
      "Wallet balances update after approved work is processed. If a balance looks wrong, compare the project status, hours, and recent submissions before contacting support.",
      "Withdrawal availability depends on funding balance, payout setup, and any required verification steps.",
    ],
  },
  {
    category: "Payments",
    title: "Wallet",
    summary: "Where to review balances, hours, and payout activity.",
    body: [
      "The wallet is the source for approved balances, withdrawal activity, and payout status.",
      "Your home page can show total hours and expected earnings as a quick summary, while the wallet contains the more detailed payment record.",
      "If a number looks wrong, compare the project status with the wallet entry before opening a support request.",
    ],
  },
  {
    category: "Payments",
    title: "Withdrawals",
    summary: "How to prepare for a successful withdrawal.",
    body: [
      "Complete onboarding and payout setup before requesting a withdrawal.",
      "Make sure your payout destination is current and belongs to you. Incorrect destination details can delay or fail a transfer.",
      "If a withdrawal fails, contact support with the amount, date, payment method, and any error text you saw.",
    ],
  },
  {
    category: "Payments",
    title: "Payment delays",
    summary: "What to check when a payment takes longer than expected.",
    body: [
      "Payment timing can depend on work review, client approval, verification, payout method, and banking schedules.",
      "Check whether the earnings are still expected, approved, or withdrawn. Each status means a different step is still pending.",
      "If the delay is outside the project guidance, contact support with the project name, amount, and submission date.",
    ],
  },
];

const sidebarArticleTitleByItem: Record<string, string> = {
  "Age requirement": "Age requirement",
  "Program overview": "Introduction to the AfterQuery AI program",
  "Getting started": "Getting started",
  "Sign up": "Sign up",
  "Post-application": "Next steps after applying to a project",
  "Identity verification": "Identity verification",
  "Phone verification": "Phone verification",
  "Troubleshoot verification": "Troubleshoot verification",
  "Background check": "Background check",
  "Background check FAQs": "Background check FAQs",
  "Verification issues": "Verification issues",
  "What to expect": "What to expect",
  "Work quality": "Work quality",
  "Staying safe": "Getting started and staying safe",
  Communication: "Communication",
  Availability: "Availability",
  "Account standing": "Account standing",
  "Project matching": "Project matching",
  "Submitting work": "Submitting project work",
  "Returned work": "Returned work",
  "Project reviews": "Project reviews",
  "Ending a project": "Ending a project",
  "Code of conduct": "Code of conduct",
  "Data handling": "Data handling",
  "Account security": "Account security",
  "Expected earnings": "Expected earnings and wallet timing",
  Wallet: "Wallet",
  Withdrawals: "Withdrawals",
  "Payment delays": "Payment delays",
};

const popularTitles = [
  "Introduction to the AfterQuery AI program",
  "Getting started and staying safe",
  "Work authorization and eligibility",
  "Next steps after applying to a project",
];

const fallbackPopularArticles = [
  "Introduction to the AfterQuery AI program",
  "Getting started and staying safe",
  "Expected earnings and wallet timing",
  "Next steps after applying to a project",
];

function getArticle(title: string) {
  return articles.find((article) => article.title === title) ?? articles[0];
}

export function HelpCenterClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [activeArticleTitle, setActiveArticleTitle] = useState(articles[0].title);
  const [supportMessage, setSupportMessage] = useState("");
  const [preparedMessage, setPreparedMessage] = useState("");

  const activeArticle = getArticle(activeArticleTitle);

  const displayedArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articles.filter((article) => {
      if (!normalizedQuery) {
        return article.category === activeCategory;
      }

      return `${article.title} ${article.summary} ${article.body.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeCategory, query]);

  const openArticle = (title: string) => {
    const article = getArticle(title);
    setActiveArticleTitle(article.title);
    setActiveCategory(article.category);
  };

  const prepareSupportMessage = () => {
    const trimmedMessage = supportMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    setPreparedMessage(trimmedMessage);
  };

  const mailtoHref = `mailto:support@afterquery.com?subject=${encodeURIComponent(
    "AfterQuery support request",
  )}&body=${encodeURIComponent(preparedMessage)}`;

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <header className="bg-[#9af4f4] px-5 py-7 md:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            className="text-3xl font-black italic text-[#071b24]"
            href="/home"
          >
            AfterQuery
          </Link>
          <div className="hidden items-center gap-9 text-sm font-semibold text-[#071b24] md:flex">
            <Link href="/apply">Find work</Link>
            <Link href="/about-us">About</Link>
            <Link href="/help-center">AfterQuery AI</Link>
            <Link href="/help-center#contact-support">Support</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-xl border border-[#071b24] px-4 py-2 text-sm font-bold text-[#071b24]"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="rounded-xl bg-[#071b24] px-4 py-2 text-sm font-bold text-white"
              href="/register"
            >
              Sign up
            </Link>
          </div>
        </nav>

        <section className="mx-auto grid max-w-7xl gap-8 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <h1 className="max-w-3xl text-[64px] font-black uppercase leading-[0.9] text-[#111827] md:text-[96px]">
              Help Center
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-medium leading-7 text-[#111827]">
              Whether you are starting onboarding, applying for projects, or
              sorting out payments, this is your support home for AfterQuery AI.
            </p>
          </div>
          <label className="flex h-14 items-center gap-3 rounded border border-[#b6bdd6] bg-white px-4 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-[#6b7280]" />
            <input
              aria-label="Search help articles"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#6b7280]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              type="search"
              value={query}
            />
          </label>
        </section>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[240px_1fr] md:px-8">
        <aside className="space-y-8">
          {sidebarGroups.map((group) => (
            <section key={group.title}>
              <h2 className="text-lg font-bold text-[#111827]">
                {group.title}
              </h2>
              <div className="mt-4 space-y-4">
                {group.items.map((item) => {
                  const articleTitle = sidebarArticleTitleByItem[item];
                  const isActive = activeArticle.title === articleTitle;

                  return (
                    <button
                className={`block text-left text-sm font-medium leading-5 transition ${
                        isActive ? "text-[#071b24]" : "text-[#4b5563]"
                      } hover:text-[#111827]`}
                      key={item}
                      onClick={() => openArticle(articleTitle)}
                      type="button"
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </aside>

        <section className="min-w-0">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold text-[#111827]">
              Welcome to AfterQuery AI
            </h2>
            <p className="mt-8 text-base font-medium leading-7 text-[#111827]">
              AfterQuery AI connects skilled contributors with flexible project
              work that helps evaluate, improve, and operate AI systems.
            </p>
          </div>

          <section className="mt-20">
            <h2 className="text-3xl font-semibold">
              Popular topics
            </h2>
            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              {popularTitles.map((title, index) => {
                const article =
                  articles.find((item) => item.title === title) ??
                  getArticle(fallbackPopularArticles[index]);

                return (
                  <button
                    className="flex min-h-32 items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-8 py-6 text-left text-xl font-semibold leading-6 transition hover:border-[#071b24] focus:outline-none focus:ring-2 focus:ring-[#071b24]"
                    key={title}
                    onClick={() => openArticle(article.title)}
                    type="button"
                  >
                    <span>{article.title}</span>
                    <ChevronRight className="h-6 w-6 shrink-0" />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-20">
            <h2 className="text-3xl font-semibold">
              Categories
            </h2>
            <div className="mt-8 max-w-2xl space-y-3">
              {categories.map((category) => (
                <button
                  className={`flex h-20 w-full items-center justify-between rounded-2xl border px-8 text-left text-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#071b24] ${
                    activeCategory === category
                      ? "border-[#071b24] bg-[#f8ffff]"
                      : "border-[#e5e7eb] bg-white hover:border-[#071b24]"
                  }`}
                  key={category}
                  onClick={() => {
                    const firstArticle =
                      articles.find((article) => article.category === category) ??
                      articles[0];
                    setActiveCategory(category);
                    openArticle(firstArticle.title);
                  }}
                  type="button"
                >
                  {category}
                  <ChevronRight className="h-6 w-6" />
                </button>
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div>
              <h2 className="text-2xl font-semibold">
                {query.trim() ? "Search results" : "Articles"}
              </h2>
              <div className="mt-5 space-y-2">
                {displayedArticles.length ? (
                  displayedArticles.map((article) => (
                    <button
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#071b24] ${
                        activeArticle.title === article.title
                          ? "bg-[#071b24] text-white"
                          : "bg-[#f4f7fb] text-[#111827] hover:bg-[#e8eef6]"
                      }`}
                      key={article.title}
                      onClick={() => openArticle(article.title)}
                      type="button"
                    >
                      {article.title}
                    </button>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#f4f7fb] p-4 text-sm text-[#4b5563]">
                    No articles match this search. Try a shorter phrase or
                    choose a category.
                  </p>
                )}
              </div>
            </div>

            <article className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
              <p className="text-sm font-bold text-[#4b5563]">
                {activeArticle.category}
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                {activeArticle.title}
              </h2>
              <p className="mt-3 text-base font-medium leading-7 text-[#4b5563]">
                {activeArticle.summary}
              </p>
              <div className="mt-6 space-y-4">
                {activeArticle.body.map((paragraph) => (
                  <p
                    className="text-sm font-medium leading-7 text-[#111827]"
                    key={paragraph}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <section
            className="mt-20 rounded-2xl border border-[#e5e7eb] bg-[#f8ffff] p-6"
            id="contact-support"
          >
            <div className="flex items-center gap-3">
              <Mail className="h-7 w-7 text-[#071b24]" />
              <h2 className="text-3xl font-semibold">
                Contact support
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#4b5563]">
              Send a clear note with your project name, account email, and the
              issue you need help with. This form prepares your message and
              opens your email app so support can follow up.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                className="h-12 rounded-xl border border-[#d1d5db] bg-white px-4 text-sm outline-none focus:border-[#071b24]"
                onChange={(event) => {
                  setSupportMessage(event.target.value);
                  setPreparedMessage("");
                }}
                placeholder="Describe what you need help with"
                value={supportMessage}
              />
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#071b24] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!supportMessage.trim()}
                onClick={prepareSupportMessage}
                type="button"
              >
                <Send className="h-4 w-4" />
                Prepare message
              </button>
            </div>
            {preparedMessage ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c7f9e7] bg-white p-4">
                <p className="text-sm font-semibold text-[#064e3b]">
                  Message prepared. Send it to support so the team can follow up.
                </p>
                <a
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#071b24] underline"
                  href={mailtoHref}
                >
                  Email support
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ) : null}
          </section>
        </section>
      </div>

      <footer className="overflow-hidden rounded-t-3xl bg-[#022b2b] px-5 py-10 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="max-w-sm text-4xl font-semibold leading-tight">
              The project network for the AI economy
            </p>
            <div className="mt-8 flex gap-3">
              <span className="rounded-lg bg-black px-4 py-2 text-xs font-bold">
                App Store
              </span>
              <span className="rounded-lg bg-black px-4 py-2 text-xs font-bold">
                Google Play
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
            {[
              ["Contributors", "Find work", "Career tips"],
              ["AfterQuery AI", "Program", "Opportunities", "Help center"],
              ["Clients", "Pricing", "Request demo"],
              ["Company", "About", "Support", "Contact"],
            ].map(([heading, ...items]) => (
              <div key={heading}>
                <h3 className="font-bold text-[#9cb8b8]">{heading}</h3>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <Link
                      className="block font-semibold text-white hover:underline"
                      href={
                        item === "Help center" || item === "Support"
                          ? "/help-center"
                          : "/home"
                      }
                      key={item}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-12 text-[92px] font-black italic leading-none text-[#ccff33] sm:text-[140px] md:text-[220px]">
          AfterQuery
        </p>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-6 text-xs font-semibold text-[#9cb8b8]">
          <span>&copy;2026 AfterQuery. All rights reserved</span>
          <Link href="/home">Privacy policy</Link>
          <Link href="/home">Accessibility</Link>
          <Link href="/home">Terms of service</Link>
        </div>
      </footer>
    </main>
  );
}
