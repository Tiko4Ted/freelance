"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  UserPlus,
  ClipboardList,
  ChevronRight,
  Info,
  ChevronDown,
  Copy,
  Wallet,
  MessageCircle,
  Send,
  X,
  Download,
  Upload,
  CheckCircle2,
  UserRound,
} from "lucide-react";
import { ProjectTaskList, type DashboardTask } from "@/components/project-task-list";

import {
  getSupportChatReply,
  type SupportChatMessage,
  type SupportTopic,
} from "@/lib/support-chat";

type DashboardProject = {
  id: string;
  applicationId?: string;
  jobId?: string;
  applyHref?: string;
  jobHref?: string;
  appliedAt?: string;
  title: string;
  description: string;
  companyName?: string;
  status: string;
  statusLabel: string;
  payoutLabel: string;
  skills: string[];
  canSubmit?: boolean;
  isSubmitted?: boolean;
  submittedFileName?: string | null;
  briefHref?: string;
  annotationHref?: string;
  isApplied?: boolean;
  showOnHome?: boolean;
  isClosed?: boolean;
  tasks?: DashboardTask[];
};

const MAX_TASK_SUBMISSION_BYTES = 4 * 1024 * 1024;

function statusPillClass(status: string) {
  if (status === "PAID") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-800";
  }

  if (status === "PAYOUT_ELIGIBLE") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "bg-red-100 text-red-800";
  }

  if (status === "CLOSED") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-[var(--color-accent-soft)] text-brand-gold-strong";
}

function projectSurfaceClass(status: string) {
  if (status === "PAID" || status === "PAYOUT_ELIGIBLE") {
    return "border-emerald-200 bg-emerald-50/30";
  }

  if (status === "REJECTED") {
    return "border-red-200 bg-red-50/30";
  }

  if (status === "CLOSED") {
    return "border-slate-200 bg-slate-50";
  }

  return "border-brand-gold/50 bg-brand-ivory";
}

function projectStatusText(project: DashboardProject, hasSubmitted: boolean) {
  const finalStatuses = ["PAID", "PAYOUT_ELIGIBLE", "REJECTED", "CLOSED"];

  return hasSubmitted && !finalStatuses.includes(project.status)
    ? "Submitted for review"
    : project.statusLabel;
}

function hasPositiveAmount(amount: string) {
  const numericAmount = Number(amount.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericAmount) && numericAmount > 0;
}

type FeaturedProject = {
  id: string;
  title: string;
  description: string;
  companyName: string;
  formattedPay?: string;
  participantCount?: number;
  participantCountLabel?: string;
  isApplied?: boolean;
  skills: Array<{
    id: string;
    label: string;
  }>;
};

interface HomeDashboardClientProps {
  paymentSummary: {
    formattedAwaitingPayment: string;
    formattedTasksCompleted: string;
  };
  featuredProjects?: FeaturedProject[];
  onboardingComplete?: boolean;
  projects?: DashboardProject[];
  referralLink?: string | null;
  userName?: string;
}

const applicationDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const faqs = [
  {
    question: "How do I start working on a project?",
    answer:
      "Begin by completing onboarding and applying for an available role. Once your application is reviewed and matched, your project activity will appear on the home page with the next steps clearly shown.",
  },
  {
    question: "Where can I see my tasks and payment status?",
    answer:
      "The home page gives a quick summary of your completed tasks and awaiting payment. For the full account record, including balances, ledger history, transfers, and withdrawals, use the wallet page.",
  },
  {
    question: "Why does some money show as awaiting payment?",
    answer:
      "Awaiting payment means the work has been recorded but the money is still being held until the required review, eligibility, or verification step is complete. This keeps the payout process traceable and easier to audit.",
  },
  {
    question: "What should I do if my progress looks incorrect?",
    answer:
      "Check your project status, submitted work, and wallet records first. If the numbers still do not match your work, contact support with the project name and the task or payment record you expected to see.",
  },
  {
    question: "How do I identify fraud or scams?",
    answer: (
      <>
        Use a simple three-part check: ask what the message wants from you,
        look for red flags, and verify the source before taking action. Be
        careful with requests for passwords, bank details, verification codes,
        urgent payment demands, shortened links, unusual email domains, or
        requests to move the conversation to WhatsApp, Google Forms, or another
        unofficial channel. If anything feels wrong, stop and use our{" "}
        <Link
          className="font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
          href="/help-center/policies#fraud-and-account-safety-guide"
        >
          Help Center fraud and account safety guide
        </Link>
        .
      </>
    ),
  },
];

export function HomeDashboardClient({
  paymentSummary,
  featuredProjects = [],
  onboardingComplete = false,
  projects = [],
  referralLink = null,
  userName = "Teddy",
}: HomeDashboardClientProps) {
  const visibleProjects = projects.filter(
    (project) => project.showOnHome !== false,
  );
  const hasAwaitingPayment = hasPositiveAmount(
    paymentSummary.formattedAwaitingPayment,
  );
  const [activeTab, setActiveTab] = useState<"projects" | "applications">(
    "projects",
  );
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "submitted" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFeedbackProjectId, setUploadFeedbackProjectId] = useState<
    string | null
  >(null);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(
    null,
  );
  const [submittedProjectIds, setSubmittedProjectIds] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([
    {
      from: "support",
      text: "Hi. What are you trying to sort out today? I can help with a task, application, payment, or account issue.",
    },
  ]);
  const [supportTopic, setSupportTopic] = useState<SupportTopic>();

  const submitProjectWork = async (project: DashboardProject, file: File) => {
    if (!project.canSubmit || !project.applicationId) {
      return;
    }

    setUploadFeedbackProjectId(project.id);

    if (file.size > MAX_TASK_SUBMISSION_BYTES) {
      setSubmissionStatus("error");
      setUploadError("This file is larger than the 4 MB upload limit.");
      return;
    }

    setSubmissionStatus("submitting");
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/v1/applications/${project.applicationId}/task-submission`,
        {
          body: formData,
          method: "POST",
        },
      );

      if (!response.ok) {
        setSubmissionStatus("error");
        setUploadError("Upload failed. Check the file and try again.");
        return;
      }

      setSubmittedProjectIds((current) =>
        current.includes(project.id) ? current : [...current, project.id],
      );
      setSubmissionStatus("submitted");
      setUploadError(null);
    } catch {
      setSubmissionStatus("error");
      setUploadError("Upload failed. Check your connection and try again.");
    }
  };

  const handleProjectFile = (project: DashboardProject, file: File | null) => {
    if (!file) {
      return;
    }

    void submitProjectWork(project, file);
  };

  const sendSupportMessage = (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const reply = getSupportChatReply(trimmedMessage, {
      lastTopic: supportTopic,
      projectTitle: visibleProjects[0]?.title,
      recentMessages: supportMessages,
      userName,
    });

    setSupportMessages((messages) => [
      ...messages,
      { from: "user", text: trimmedMessage },
      { from: "support", ...reply },
    ]);
    setSupportTopic(reply.topic);
    setSupportMessage("");
  };

  const copyReferralLink = async () => {
    if (!referralLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralCopied(true);
      window.setTimeout(() => setReferralCopied(false), 2000);
    } catch {
      setReferralCopied(false);
    }
  };

  return (
    <div className="home-dashboard flex flex-col gap-5">
      <div className="w-full min-w-0 space-y-5">
        {!onboardingComplete ? (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Clock
            className="h-4 w-4 shrink-0 text-[#d97706]"
            strokeWidth={2}
          />
          <span className="text-sm font-medium text-[#78350f]">
            Application under review. We&apos;ll reach out once verified.
          </span>
        </div>
        <Link
          href="/apply"
          className="text-sm font-semibold text-[#78350f] hover:underline"
        >
          View roles
        </Link>
      </div>
        ) : null}

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)]">
        <div className="rounded-[18px] border border-brand-sand bg-brand-ivory px-5 py-5 shadow-brand-card md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
                Your workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-brand-ink md:text-[28px]">
                Welcome back, {userName}
              </h1>
              <p className="mt-1.5 text-sm text-brand-muted">
                Keep moving on current work or find your next role.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-brand-sand/70 pt-4 sm:max-w-md">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                Total tasks
                <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-ink">
                {paymentSummary.formattedTasksCompleted}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                Open roles
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-gold-strong">
                {featuredProjects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Link
            href="/wallet"
            className={`group rounded-[18px] border p-5 shadow-brand-card transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-brand-canvas ${
              hasAwaitingPayment
                ? "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300 hover:bg-emerald-50"
                : "border-brand-sand bg-brand-ivory hover:border-brand-gold/60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    hasAwaitingPayment
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[var(--color-accent-soft)] text-brand-gold-strong"
                  }`}
                >
                  <Wallet className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                      hasAwaitingPayment
                        ? "text-emerald-700"
                        : "text-brand-muted"
                    }`}
                  >
                    Awaiting payment
                  </p>
                  <p
                    className={`mt-1 text-3xl font-semibold tracking-[-0.05em] ${
                      hasAwaitingPayment
                        ? "text-emerald-800"
                        : "text-brand-ink"
                    }`}
                  >
                    {paymentSummary.formattedAwaitingPayment}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${
                  hasAwaitingPayment
                    ? "text-emerald-600"
                    : "text-slate-400"
                }`}
                strokeWidth={2}
              />
            </div>
            <p
              className={`mt-4 max-w-sm text-sm leading-5 ${
                hasAwaitingPayment ? "text-emerald-800/80" : "text-brand-muted"
              }`}
            >
              {hasAwaitingPayment
                ? "Your completed work is moving through review."
                : "Your first completed payment will appear here."}
            </p>
            <span
              className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${
                hasAwaitingPayment
                  ? "text-emerald-800"
                  : "text-brand-gold-strong"
              }`}
            >
              Open wallet
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </Link>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-brand-gold/40 bg-[var(--color-accent-soft)] p-4 shadow-brand-card">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-ivory/80">
                <UserPlus className="h-4 w-4 text-brand-gold-strong" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
                  Refer &amp; Earn
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">
                  Earn up to $300
                </p>
                <Link
                  href="/help-center/policies"
                  className="mt-1 inline-flex text-[11px] font-medium text-brand-muted hover:text-brand-ink hover:underline"
                >
                  View terms
                </Link>
                <Link
                  href="/referral"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
                >
                  Open referral details
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={copyReferralLink}
                  disabled={!referralLink}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:text-brand-gold-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  {referralCopied ? "Copied!" : "Copy referral link"}
                </button>
              </div>
            </div>
            </div>

            <div className="rounded-[18px] border border-brand-sand bg-brand-ivory p-4 shadow-brand-card">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-ink">
                <span className="text-xs font-bold text-brand-gold-light">VS</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                  Try Versus
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-muted">
                  Compare AI responses and find what works best.
                </p>
                <Link
                  href="/apply"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
                >
                  Try now
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {!onboardingComplete ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Next up
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold-strong text-[11px] font-bold text-brand-ivory shadow-xs">
            1
          </span>
        </div>

        <Link
          href="/onboarding"
          className="group flex items-center justify-between rounded-[18px] border border-brand-sand bg-brand-ivory p-5 shadow-brand-card transition hover:border-brand-gold/60 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-brand-gold/35 bg-[var(--color-accent-soft)]">
              <ClipboardList
                className="h-6 w-6 text-brand-gold-strong"
                strokeWidth={2}
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-ink transition group-hover:text-brand-gold-strong">
                Complete onboarding
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Finish your onboarding to unlock projects and start working.
              </p>
            </div>
          </div>
          <ChevronRight
            className="h-5 w-5 text-slate-400 transition group-hover:text-slate-600 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </Link>
      </section>
      ) : null}

      {featuredProjects.length ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
                Open roles
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-ink md:text-2xl">
                Featured projects
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
              href="/jobs"
            >
              View all roles
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {featuredProjects.map((project) => {
              const cardClassName = `flex min-h-[168px] flex-col justify-between rounded-[18px] border p-4 text-left shadow-brand-card ${
                project.isApplied
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "group border-brand-sand transition hover:-translate-y-0.5 hover:border-brand-gold/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
              }`;
              const cardContent = (
                <>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold-strong">
                          {project.companyName}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-brand-ink transition group-hover:text-brand-gold-strong">
                          {project.title}
                        </h3>
                      </div>
                      {project.isApplied ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-gold-strong" />
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-brand-muted">
                      {project.description}
                    </p>
                    {project.formattedPay ? (
                      <p className="mt-2 text-sm font-semibold text-emerald-800">
                        Pay: {project.formattedPay}
                      </p>
                    ) : null}
                    {project.participantCountLabel ? (
                      <div className="mt-2 flex items-center gap-2">
                        <div aria-hidden="true" className="flex -space-x-2">
                          {[
                            "bg-[#d7c7aa] text-[#5d482f]",
                            "bg-[#c7d0c1] text-[#405247]",
                            "bg-[#c9c9d2] text-[#4c4c5c]",
                          ].map((avatarClassName) => (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand-ivory ${avatarClassName}`}
                              key={avatarClassName}
                            >
                              <UserRound className="h-3 w-3" strokeWidth={2} />
                            </span>
                          ))}
                        </div>
                        <span
                          aria-label={`${project.participantCount?.toLocaleString("en-US") ?? project.participantCountLabel} participants`}
                          className="text-xs font-semibold text-brand-muted"
                        >
                          {project.participantCountLabel} participants
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {project.skills.slice(0, 2).map((skill) => (
                      <span
                        className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-brand-gold-strong"
                        key={skill.id}
                      >
                        {skill.label}
                      </span>
                    ))}
                    {project.isApplied ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Applied
                      </span>
                    ) : null}
                  </div>
                </>
              );

              return project.isApplied ? (
                <article className={cardClassName} key={project.id}>
                  {cardContent}
                </article>
              ) : (
                <Link
                  className={cardClassName}
                  href={`/jobs/${project.id}`}
                  key={project.id}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Tabs: Projects / Applications */}
      <div className="border-t border-brand-sand/70 pt-4">
        <div className="inline-flex rounded-full border border-brand-sand bg-[#e7e3da] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "projects"
                ? "bg-brand-ivory text-brand-ink shadow-sm"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeTab === "applications"
                ? "bg-brand-ivory text-brand-ink shadow-sm font-semibold"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            Applications
          </button>
        </div>
      </div>

      {activeTab === "projects" ? (
        <>
          {/* Your projects Header */}
          <section className="space-y-4 border-l-2 border-emerald-200 pl-4 md:pl-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-ink">
                Your projects{" "}
                <span className="font-normal text-slate-400">
                  ({visibleProjects.length})
                </span>
              </h2>
              <Link
                href="/about-us"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
              >
                <Info className="h-3.5 w-3.5" strokeWidth={2} />
                About us
              </Link>
            </div>

            {/* Project Cards Grid */}
            {visibleProjects.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleProjects.map((project) => {
                const isApplied = project.isApplied !== false;
                const hasSubmitted =
                  project.isSubmitted || submittedProjectIds.includes(project.id);
                const canUpload = Boolean(project.canSubmit) && !hasSubmitted;
                const isFailed = project.status === "REJECTED";
                const isClosed = project.isClosed || project.status === "CLOSED";
                const isUploading =
                  uploadFeedbackProjectId === project.id &&
                  submissionStatus === "submitting";
                const projectUploadError =
                  uploadFeedbackProjectId === project.id ? uploadError : null;

                if (project.tasks?.length) {
                  return (
                    <article className={`col-span-full rounded-[18px] border p-5 text-left shadow-brand-card ${projectSurfaceClass(project.status)}`} key={project.id}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-brand-gold-strong">Project workspace</span><span className="text-xs font-semibold text-emerald-700">{project.tasks.filter((task) => task.status === "OPEN").length} open tasks</span></div>
                          <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-brand-ink">{project.title}</h3>
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-muted">{project.description}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(project.status)}`}>{project.statusLabel}</span>
                      </div>
                      <ProjectTaskList tasks={project.tasks} />
                    </article>
                  );
                }

                return (
                  <article
                    className={`flex min-h-[160px] flex-col justify-between rounded-[18px] border p-5 text-left shadow-brand-card transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-gold ${projectSurfaceClass(project.status)} ${
                      isApplied ? "" : "hover:border-brand-gold/60"
                    }`}
                    key={project.id}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {project.title}
                        </h3>
                        {isApplied ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {project.description}
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${statusPillClass(project.status)}`}
                      >
                        {projectStatusText(project, hasSubmitted)}
                      </span>
                      <span className="font-medium text-emerald-800">
                        {project.payoutLabel}
                      </span>
                      {isApplied ? (
                        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Applied
                        </span>
                      ) : null}
                    </div>
                    {isApplied ? (
                      <div className="mt-4 border-t border-brand-sand/70 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {isClosed ? (
                            <span className="text-xs text-brand-muted">
                              This project is closed. Task materials and uploads
                              are no longer available.
                            </span>
                          ) : isFailed ? (
                            <span className="text-xs text-brand-muted">
                              Task materials and uploads are unavailable because
                              the aptitude test was not passed.
                            </span>
                          ) : (
                            <>
                          {project.briefHref ? (
                            <a
                              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-brand-sand bg-brand-ivory px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-gold/60 hover:bg-[var(--color-accent-soft)] focus:outline-none focus:ring-2 focus:ring-brand-gold"
                              download
                              href={project.briefHref}
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download materials
                            </a>
                          ) : (
                            <span className="text-xs text-brand-muted">
                              Materials unlock after project approval.
                            </span>
                          )}
                          {project.annotationHref ? (
                            <Link
                              className="inline-flex h-9 items-center rounded-[10px] border border-brand-gold/60 bg-[var(--color-accent-soft)] px-3 text-xs font-semibold text-brand-gold-strong transition hover:border-brand-gold hover:text-brand-ink"
                              href={project.annotationHref}
                            >
                              Open evaluation task
                            </Link>
                          ) : null}
                          {canUpload ? (
                            <label
                              className={`inline-flex min-h-10 min-w-[220px] cursor-pointer items-center gap-2 rounded-[10px] border border-dashed px-3 py-2 text-xs font-semibold text-brand-ink transition focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-gold ${
                                draggingProjectId === project.id
                                  ? "border-brand-gold bg-[var(--color-accent-soft)]"
                                  : "border-brand-sand bg-brand-ivory hover:border-brand-gold/60 hover:bg-[var(--color-accent-soft)]"
                              }`}
                              htmlFor={`task-file-${project.id}`}
                              onDragEnter={(event) => {
                                event.preventDefault();
                                setDraggingProjectId(project.id);
                              }}
                              onDragLeave={() => setDraggingProjectId(null)}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setDraggingProjectId(project.id);
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                setDraggingProjectId(null);
                                handleProjectFile(
                                  project,
                                  event.dataTransfer.files?.[0] ?? null,
                                );
                              }}
                            >
                              <Upload className="h-3.5 w-3.5 shrink-0" />
                              <span className="min-w-0">
                                <span className="block truncate">
                                  {isUploading
                                    ? "Uploading..."
                                    : "Upload completed work"}
                                </span>
                                <span className="block text-[11px] font-medium text-brand-muted">
                                  Drop a file or click to choose
                                </span>
                              </span>
                            </label>
                          ) : (
                            <button
                              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-brand-sand bg-brand-ivory px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-gold/60 hover:bg-[var(--color-accent-soft)] focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
                              disabled
                              type="button"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              {hasSubmitted ? "Submitted" : "Upload completed work"}
                            </button>
                          )}
                          <input
                            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                            className="sr-only"
                            id={`task-file-${project.id}`}
                            onChange={(event) => {
                              const nextFile = event.target.files?.[0] ?? null;
                              event.currentTarget.value = "";
                              handleProjectFile(project, nextFile);
                            }}
                            type="file"
                          />
                            </>
                          )}
                        </div>
                        {projectUploadError ? (
                          <p className="mt-2 text-xs font-semibold text-red-600">
                            {projectUploadError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            ) : (
              <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-8 text-center shadow-xs">
                <p className="text-sm font-semibold text-brand-ink">
                  No projects are currently available.
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  Closed work remains available in your project history.
                </p>
                {projects.length ? (
                  <button
                    className="mt-4 text-sm font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
                    onClick={() => setActiveTab("applications")}
                    type="button"
                  >
                    View project history
                  </button>
                ) : null}
              </div>
            )}
          </section>
        </>
      ) : (
          <section className="space-y-4 border-l-2 border-brand-gold/50 pl-4 md:pl-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-brand-ink">
                Your applications{" "}
                <span className="font-normal text-slate-400">
                  ({projects.length})
                </span>
              </h2>
              <Link
                href="/apply"
                className="text-sm font-semibold text-brand-gold-strong transition hover:text-brand-ink hover:underline"
              >
                Browse roles
              </Link>
            </div>

            {projects.length ? (
              <div className="space-y-3">
                {projects.map((application) => (
                  <article
                    className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-[0_1px_3px_rgba(38,41,31,0.04)]"
                    key={application.id}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(application.status)}`}
                          >
                            {application.statusLabel}
                          </span>
                          {application.appliedAt ? (
                            <span className="text-xs text-slate-500">
                              Applied{" "}
                              {applicationDateFormatter.format(
                                new Date(application.appliedAt),
                              )}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-base font-bold text-slate-950">
                          {application.title}
                        </h3>
                        {application.companyName ? (
                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {application.companyName}
                          </p>
                        ) : null}
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {application.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                        <span className="text-sm font-semibold text-emerald-800">
                          {application.payoutLabel}
                        </span>
                        {application.isClosed ? (
                          <span className="text-sm font-semibold text-brand-muted">
                            Closed
                          </span>
                        ) : (
                          <Link
                            href={
                              application.jobHref ??
                              application.applyHref ??
                              "/apply"
                            }
                            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-gold-strong transition hover:text-brand-ink hover:underline"
                          >
                            View role
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-8 text-center shadow-xs">
                <p className="text-sm font-medium text-slate-700">
                  You have not submitted any applications yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Browse open roles and apply when you find a good match.
                </p>
                <Link
                  href="/apply"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
                >
                  Browse roles
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4 border-t border-brand-sand/70 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-ink">
                Frequently asked questions
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Quick answers about projects, tasks, payments, safety, and what
                to check next.
              </p>
            </div>
            <Link
              href="/about-us"
              className="text-sm font-semibold text-brand-gold-strong transition hover:text-brand-ink hover:underline"
            >
              Learn more
            </Link>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-brand-sand bg-brand-ivory shadow-brand-card">
            {faqs.map((faq) => (
              <details
                className="group border-b border-brand-sand/70 last:border-b-0"
                key={faq.question}
              >
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-brand-ink transition [&::-webkit-details-marker]:hidden ${
                    faq.question.includes("money")
                      ? "hover:bg-emerald-50/70"
                      : "hover:bg-[#f2e8d7]"
                  }`}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    strokeWidth={2}
                  />
                </summary>
                <div className="px-5 pb-5 text-sm leading-6 text-slate-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {helpOpen ? (
          <div className="w-[calc(100vw-3rem)] max-w-sm overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-brand-gold/25 bg-brand-ink px-5 py-4 text-brand-ivory">
              <div>
                <h2 className="text-sm font-semibold">Support</h2>
                <p className="mt-1 text-xs text-slate-300">
                  Quick help for work, payments, and account questions.
                </p>
              </div>
              <button
                aria-label="Close support"
                className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={() => setHelpOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto px-5 py-4">
              {supportMessages.map((message, index) => (
                <div
                  className={`flex ${
                    message.from === "user" ? "justify-end" : "justify-start"
                  }`}
                  key={`${message.from}-${index}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                      message.from === "user"
                        ? "bg-brand-gold text-brand-ink"
                        : "bg-[#f1ebdf] text-brand-ink"
                    }`}
                  >
                    {message.text}
                    {message.action ? (
                      <Link
                        className="mt-2 block font-semibold text-brand-gold-strong underline-offset-2 hover:underline"
                        href={message.action.href}
                      >
                        {message.action.label}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-sand px-5 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {["Payment status", "Withdrawal issue", "Why Freelance ID?", "Can't sign in", "Task question", "Safety concern"].map(
                  (topic) => (
                    <button
                      className={`rounded-full border bg-brand-ivory px-3 py-1.5 text-xs font-medium transition ${
                        topic === "Payment status"
                          ? "border-emerald-200 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50"
                          : "border-brand-sand text-brand-muted hover:border-brand-gold hover:bg-[#f2e8d7] hover:text-brand-ink"
                      }`}
                      key={topic}
                      onClick={() => setSupportMessage(topic)}
                      type="button"
                    >
                      {topic}
                    </button>
                  ),
                )}
              </div>
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendSupportMessage(supportMessage);
                }}
              >
                <input
                  className="h-11 min-w-0 flex-1 rounded-xl border border-brand-sand bg-brand-ivory px-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                  onChange={(event) => setSupportMessage(event.target.value)}
                  placeholder="Type your question"
                  value={supportMessage}
                />
                <button
                  aria-label="Send support message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-ink text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!supportMessage.trim()}
                  type="submit"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : null}

        <button
          className="flex h-14 items-center gap-2 rounded-full bg-brand-ink px-5 text-sm font-semibold text-brand-ivory shadow-xl transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-canvas"
          onClick={() => setHelpOpen((open) => !open)}
          type="button"
        >
          <MessageCircle className="h-5 w-5" />
          Support
        </button>
      </div>
    </div>
  );
}
