"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Mail,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

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

const categoryIds: Record<string, string> = {
  "Getting Started": "getting-started",
  "Fellowship Expectations": "fellowship-expectations",
  "Project Participation": "project-participation",
  Policies: "policies",
  Payments: "payments",
};

function toId(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCategoryById(categoryId?: string) {
  return (
    categories.find((category) => categoryIds[category] === categoryId) ??
    categories[0]
  );
}

function categoryHref(category: string) {
  return `/help-center/${categoryIds[category]}`;
}

const articles: Article[] = [
  {
    category: "Getting Started",
    title: "Introduction to the Trinity-AI program",
    summary:
      "A practical overview of how flexible project-based AI work runs on Trinity-AI.",
    body: [
      "Trinity-AI connects qualified contributors with remote projects that evaluate, improve, and operate AI systems. Most people begin by creating an account, completing onboarding, and waiting for project matching.",
      "Your dashboard shows required tasks, applications, total hours, expected earnings, and support shortcuts. Complete each required verification step before applying for projects with stricter client requirements.",
      "When you are ready to work, use the Apply page to review available roles and follow the project instructions shown there.",
    ],
  },
  {
    category: "Getting Started",
    title: "Age requirement",
    summary: "Who can create an account and participate in Trinity-AI work.",
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
    summary: "How to create a Trinity-AI account and avoid duplicate profiles.",
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
    summary: "What to check before accepting work on Trinity-AI.",
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
      "Trinity-AI will not ask you to move payment setup to unverified channels. Keep project details, files, and payment questions inside approved workflows.",
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
    summary: "The behavior expected from everyone using Trinity-AI.",
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
      "Be careful with links that claim to be urgent payment or identity checks. Open Trinity-AI directly and use the in-app flow.",
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

const popularTitles = [
  "Introduction to the Trinity-AI program",
  "Getting started and staying safe",
  "Work authorization and eligibility",
  "Next steps after applying to a project",
];

const categoryIcons: Record<string, LucideIcon> = {
  "Getting Started": Rocket,
  "Fellowship Expectations": ClipboardCheck,
  "Project Participation": BriefcaseBusiness,
  Policies: ShieldCheck,
  Payments: WalletCards,
};

const quickHelpTitles = [
  "Getting started",
  "Identity verification",
  "Expected earnings and wallet timing",
];

function getArticle(title: string) {
  return articles.find((article) => article.title === title) ?? articles[0];
}

function subscribeToHashChange(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);

  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getHashSnapshot() {
  return window.location.hash.replace("#", "");
}

function getServerHashSnapshot() {
  return "";
}

function useCurrentHash() {
  return useSyncExternalStore(
    subscribeToHashChange,
    getHashSnapshot,
    getServerHashSnapshot,
  );
}

type HelpCenterClientProps = {
  categoryId?: string;
};

export function HelpCenterClient({ categoryId }: HelpCenterClientProps) {
  const currentHash = useCurrentHash();
  const initialCategory = getCategoryById(categoryId);
  const isCategoryPage = Boolean(categoryId);
  const initialArticle =
    articles.find((article) => article.category === initialCategory) ??
    articles[0];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeArticleTitle, setActiveArticleTitle] = useState(
    initialArticle.title,
  );
  const [supportMessage, setSupportMessage] = useState("");
  const [preparedMessage, setPreparedMessage] = useState("");

  const hashArticle = useMemo(
    () =>
      articles.find(
        (article) =>
          article.category === activeCategory &&
          toId(article.title) === currentHash,
      ),
    [activeCategory, currentHash],
  );
  const activeArticle = hashArticle ?? getArticle(activeArticleTitle);

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

  const mailtoHref = `mailto:support@trinity-ai.com?subject=${encodeURIComponent(
    "Trinity-AI support request",
  )}&body=${encodeURIComponent(preparedMessage)}`;
  const hasQuery = Boolean(query.trim());
  const articleCountLabel = `${displayedArticles.length} ${
    displayedArticles.length === 1 ? "article" : "articles"
  }`;

  return (
    <main className="min-h-screen bg-brand-canvas text-brand-ink dark:bg-[#171915] dark:text-[#f7f3ea]">
      <a
        className="sr-only rounded-xl bg-brand-ink px-4 py-3 text-brand-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 dark:bg-brand-gold-light dark:text-brand-ink"
        href="#help-library"
      >
        Skip to help articles
      </a>

      <header className="border-b border-brand-sand/80 bg-brand-canvas dark:border-[#363a30] dark:bg-[#171915]">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        >
          <Link aria-label="Trinity-AI home" href="/home">
            <BrandLogo
              imageClassName="h-10 w-10 shadow-sm"
              nameClassName="hidden text-lg font-black italic text-brand-ink dark:text-[#f7f3ea] sm:inline"
              showName
              size={40}
            />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-semibold text-brand-muted dark:text-[#b8b9b1] md:flex">
            <Link
              className="text-brand-ink transition hover:text-brand-gold-strong dark:text-[#f7f3ea] dark:hover:text-brand-gold-light"
              href="/help-center"
            >
              Help center
            </Link>
            <Link
              className="transition hover:text-brand-ink dark:hover:text-[#f7f3ea]"
              href="/apply"
            >
              Find work
            </Link>
            <Link
              className="transition hover:text-brand-ink dark:hover:text-[#f7f3ea]"
              href="/about-us"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl border border-brand-sand px-3 text-sm font-bold text-brand-ink transition hover:border-brand-gold active:translate-y-px dark:border-[#4c5044] dark:text-[#f7f3ea] dark:hover:border-brand-gold"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-brand-ink px-3 text-sm font-bold text-brand-ivory transition hover:bg-[#35392c] active:translate-y-px dark:bg-brand-gold-light dark:text-brand-ink dark:hover:bg-[#f3dcae]"
              href="/register"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <section className="border-b border-brand-sand/80 dark:border-[#363a30]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold text-brand-gold-strong dark:text-brand-gold-light">
              Trinity-AI Help Center
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.045em] text-brand-ink dark:text-[#f7f3ea] sm:text-5xl lg:text-6xl lg:leading-[1.02]">
              Help for every step of the work.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-muted dark:text-[#b8b9b1]">
              Find clear guidance for onboarding, project work, account safety,
              and getting paid.
            </p>
            <label className="mt-8 block max-w-2xl">
              <span className="text-sm font-bold text-brand-ink dark:text-[#f7f3ea]">
                Search the help center
              </span>
              <span className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-brand-sand bg-brand-ivory px-4 shadow-[0_16px_50px_rgba(38,41,31,0.08)] transition focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/30 dark:border-[#44483d] dark:bg-[#23261f] dark:shadow-none">
                <Search className="h-5 w-5 shrink-0 text-brand-gold-strong dark:text-brand-gold-light" />
                <input
                  className="h-12 min-w-0 flex-1 bg-transparent text-base text-brand-ink outline-none placeholder:text-[#77796f] dark:text-[#f7f3ea] dark:placeholder:text-[#9b9d94]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search onboarding, payments, or projects"
                  type="search"
                  value={query}
                />
              </span>
            </label>
          </div>

          <aside className="rounded-2xl border border-brand-gold/50 bg-[#f2e8d7] p-5 dark:border-brand-gold/40 dark:bg-[#29271f] sm:p-6">
            <div className="flex items-center gap-3">
              <CircleHelp className="h-5 w-5 text-brand-gold-strong dark:text-brand-gold-light" />
              <h2 className="text-lg font-bold">Most requested help</h2>
            </div>
            <div className="mt-4 space-y-1">
              {quickHelpTitles.map((title) => {
                const article = getArticle(title);

                return (
                  <Link
                    className="group flex items-center justify-between gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-brand-ivory/70 active:translate-y-px dark:hover:bg-[#35372f]"
                    href={`${categoryHref(article.category)}#${toId(
                      article.title,
                    )}`}
                    key={title}
                    onClick={() => openArticle(article.title)}
                  >
                    <span>{article.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      {!isCategoryPage && !hasQuery ? (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-20 sm:px-6 lg:px-8">
          <section aria-labelledby="popular-heading">
            <h2
              className="text-3xl font-black tracking-[-0.035em] sm:text-4xl"
              id="popular-heading"
            >
              Start with a popular guide
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-12 md:grid-rows-3">
              {popularTitles.map((title, index) => {
                const article = getArticle(title);
                const ArticleIcon = index === 0 ? BookOpen : CheckCircle2;

                return (
                  <Link
                    className={`group flex min-h-36 flex-col justify-between rounded-2xl border border-brand-sand bg-brand-ivory p-6 transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-[0_18px_45px_rgba(38,41,31,0.08)] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 active:translate-y-px dark:border-[#3b3f35] dark:bg-[#20231d] dark:hover:border-brand-gold dark:hover:shadow-none ${
                      index === 0
                        ? "md:col-span-7 md:row-span-3 md:min-h-[28rem] md:p-8"
                        : "md:col-span-5"
                    }`}
                    href={`${categoryHref(article.category)}#${toId(
                      article.title,
                    )}`}
                    key={title}
                    onClick={() => openArticle(article.title)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <ArticleIcon className="h-6 w-6 text-brand-gold-strong dark:text-brand-gold-light" />
                      <ChevronRight className="h-5 w-5 text-brand-muted transition-transform group-hover:translate-x-0.5 dark:text-[#9b9d94]" />
                    </div>
                    <div className={index === 0 ? "mt-16" : "mt-8"}>
                      <p className="text-sm font-semibold text-brand-gold-strong dark:text-brand-gold-light">
                        {article.category}
                      </p>
                      <h3
                        className={`mt-2 font-bold tracking-[-0.025em] ${
                          index === 0 ? "text-3xl sm:text-4xl" : "text-xl"
                        }`}
                      >
                        {article.title}
                      </h3>
                      {index === 0 ? (
                        <p className="mt-4 max-w-lg text-sm leading-6 text-brand-muted dark:text-[#b8b9b1]">
                          {article.summary}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Browse by topic
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-brand-muted dark:text-[#b8b9b1]">
                Follow the part of your Trinity-AI journey you need help with
                right now.
              </p>
            </div>
            <div className="space-y-2">
              {categories.map((category) => {
                const CategoryIcon = categoryIcons[category];
                const categoryArticleCount = articles.filter(
                  (article) => article.category === category,
                ).length;

                return (
                  <Link
                    className="group grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-transparent px-4 py-4 transition hover:border-brand-sand hover:bg-brand-ivory focus:outline-none focus:ring-2 focus:ring-brand-gold/40 active:translate-y-px dark:hover:border-[#3b3f35] dark:hover:bg-[#20231d] sm:px-5"
                    href={categoryHref(category)}
                    key={category}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2e8d7] text-brand-gold-strong dark:bg-[#302d24] dark:text-brand-gold-light">
                      <CategoryIcon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-bold sm:text-lg">
                        {category}
                      </span>
                      <span className="mt-0.5 block text-sm text-brand-muted dark:text-[#b8b9b1]">
                        {categoryArticleCount} articles
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-brand-muted transition-transform group-hover:translate-x-0.5 dark:text-[#9b9d94]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      <section
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${
          isCategoryPage || hasQuery ? "py-16 md:py-20" : "pb-24"
        }`}
        id="help-library"
      >
        {isCategoryPage ? (
          <div className="mb-10 max-w-3xl">
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold-strong transition hover:text-brand-ink dark:text-brand-gold-light dark:hover:text-[#f7f3ea]"
              href="/help-center"
            >
              <ArrowLeft className="h-4 w-4" />
              All help topics
            </Link>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {activeCategory}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-brand-muted dark:text-[#b8b9b1]">
              Practical guidance for {activeCategory.toLowerCase()} on
              Trinity-AI.
            </p>
          </div>
        ) : hasQuery ? (
          <div className="mb-8">
            <p className="text-sm font-bold text-brand-gold-strong dark:text-brand-gold-light">
              Search results
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">
              {articleCountLabel} for &ldquo;{query.trim()}&rdquo;
            </h2>
          </div>
        ) : (
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              Read the full library
            </h2>
            <p className="mt-4 text-base leading-7 text-brand-muted dark:text-[#b8b9b1]">
              Choose a topic and open any guide without leaving the page.
            </p>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[210px_300px_minmax(0,1fr)]">
          <nav
            aria-label="Help categories"
            className="flex gap-2 overflow-x-auto pb-2 xl:block xl:space-y-1 xl:overflow-visible xl:pb-0"
          >
            {categories.map((category) => {
              const CategoryIcon = categoryIcons[category];
              const isActive = !hasQuery && activeCategory === category;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 active:translate-y-px xl:w-full ${
                    isActive
                      ? "bg-[#f2e8d7] text-brand-ink dark:bg-[#302d24] dark:text-[#f7f3ea]"
                      : "text-brand-muted hover:bg-brand-ivory hover:text-brand-ink dark:text-[#b8b9b1] dark:hover:bg-[#20231d] dark:hover:text-[#f7f3ea]"
                  }`}
                  href={categoryHref(category)}
                  key={category}
                >
                  <CategoryIcon className="h-4 w-4 shrink-0" />
                  {category}
                </Link>
              );
            })}
          </nav>

          <div
            aria-live="polite"
            className="rounded-2xl border border-brand-sand bg-brand-ivory p-2 dark:border-[#3b3f35] dark:bg-[#20231d] xl:max-h-[680px] xl:overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-2">
              <h3 className="text-sm font-bold">
                {hasQuery ? "Matches" : activeCategory}
              </h3>
              <span className="text-xs font-semibold text-brand-muted dark:text-[#9b9d94]">
                {articleCountLabel}
              </span>
            </div>
            {displayedArticles.length ? (
              <div className="space-y-1">
                {displayedArticles.map((article) => {
                  const isActive = activeArticle.title === article.title;

                  return (
                    <Link
                      aria-current={isActive ? "location" : undefined}
                      className={`block rounded-xl px-3 py-3 transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 active:translate-y-px ${
                        isActive
                          ? "bg-brand-ink text-brand-ivory dark:bg-brand-gold-light dark:text-brand-ink"
                          : "hover:bg-[#f2e8d7] dark:hover:bg-[#302d24]"
                      }`}
                      href={`${categoryHref(article.category)}#${toId(
                        article.title,
                      )}`}
                      key={article.title}
                      onClick={() => openArticle(article.title)}
                    >
                      {hasQuery ? (
                        <span
                          className={`mb-1 block text-xs font-semibold ${
                            isActive
                              ? "text-brand-gold-light dark:text-brand-gold-strong"
                              : "text-brand-gold-strong dark:text-brand-gold-light"
                          }`}
                        >
                          {article.category}
                        </span>
                      ) : null}
                      <span className="block text-sm font-semibold leading-5">
                        {article.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-10 text-center">
                <CircleHelp className="mx-auto h-7 w-7 text-brand-gold-strong dark:text-brand-gold-light" />
                <p className="mt-3 text-sm font-bold">No matching articles</p>
                <p className="mt-1 text-sm leading-6 text-brand-muted dark:text-[#b8b9b1]">
                  Try a shorter phrase or browse a topic.
                </p>
              </div>
            )}
          </div>

          <article
            className="scroll-mt-24 rounded-2xl border border-brand-sand bg-brand-ivory p-6 dark:border-[#3b3f35] dark:bg-[#20231d] sm:p-8 xl:sticky xl:top-6 xl:self-start"
            id={toId(activeArticle.title)}
          >
            <p className="text-sm font-bold text-brand-gold-strong dark:text-brand-gold-light">
              {activeArticle.category}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              {activeArticle.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-brand-muted dark:text-[#b8b9b1]">
              {activeArticle.summary}
            </p>
            <div className="mt-7 space-y-5 border-t border-brand-sand pt-7 dark:border-[#3b3f35]">
              {activeArticle.body.map((paragraph) => (
                <p className="text-sm leading-7 sm:text-base" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section
        className="border-y border-brand-sand bg-[#f2e8d7] dark:border-[#3b3f35] dark:bg-[#29271f]"
        id="contact-support"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-8">
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-ivory text-brand-gold-strong dark:bg-[#20231d] dark:text-brand-gold-light">
              <Mail className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              Still need help?
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-brand-muted dark:text-[#b8b9b1]">
              Include the project name, your account email, and the exact issue
              so support can respond clearly.
            </p>
          </div>
          <div>
            <label className="block" htmlFor="support-message">
              <span className="text-sm font-bold">Describe the issue</span>
              <textarea
                className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-brand-sand bg-brand-ivory px-4 py-3 text-sm leading-6 text-brand-ink outline-none placeholder:text-[#77796f] focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 dark:border-[#44483d] dark:bg-[#20231d] dark:text-[#f7f3ea] dark:placeholder:text-[#9b9d94]"
                id="support-message"
                onChange={(event) => {
                  setSupportMessage(event.target.value);
                  setPreparedMessage("");
                }}
                placeholder="Tell us what happened and what you expected."
                value={supportMessage}
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-brand-muted dark:text-[#b8b9b1]">
              This opens your email app. Your message is not submitted until
              you send the email.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-ink px-5 text-sm font-bold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-gold-light dark:text-brand-ink dark:hover:bg-[#f3dcae]"
                disabled={!supportMessage.trim()}
                onClick={prepareSupportMessage}
                type="button"
              >
                <Send className="h-4 w-4" />
                Prepare email
              </button>
              {preparedMessage ? (
                <a
                  className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-brand-gold px-5 text-sm font-bold text-brand-ink transition hover:bg-brand-ivory focus:outline-none focus:ring-2 focus:ring-brand-gold/40 active:translate-y-px dark:text-[#f7f3ea] dark:hover:bg-[#20231d]"
                  href={mailtoHref}
                >
                  Email support
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            {preparedMessage ? (
              <p
                className="mt-3 text-sm font-semibold text-brand-gold-strong dark:text-brand-gold-light"
                role="status"
              >
                Your message is ready to open in your email app.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="bg-brand-canvas dark:bg-[#171915]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <BrandLogo
              imageClassName="h-9 w-9"
              nameClassName="text-base font-black italic text-brand-ink dark:text-[#f7f3ea]"
              showName
              size={36}
            />
            <p className="mt-3 text-sm text-brand-muted dark:text-[#b8b9b1]">
              Clear answers for contributors doing important AI work.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-brand-muted dark:text-[#b8b9b1]">
            <Link
              className="hover:text-brand-ink dark:hover:text-[#f7f3ea]"
              href="/apply"
            >
              Find work
            </Link>
            <Link
              className="hover:text-brand-ink dark:hover:text-[#f7f3ea]"
              href="/about-us"
            >
              About
            </Link>
            <Link
              className="hover:text-brand-ink dark:hover:text-[#f7f3ea]"
              href="/help-center#contact-support"
            >
              Support
            </Link>
            <span>&copy; 2026 Trinity-AI</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
