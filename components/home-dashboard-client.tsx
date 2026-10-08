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
} from "lucide-react";

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
  payoutType: string;
  skills: string[];
  canSubmit?: boolean;
  isSubmitted?: boolean;
  submittedFileName?: string | null;
  briefHref?: string;
  isApplied?: boolean;
};

const MAX_TASK_SUBMISSION_BYTES = 4 * 1024 * 1024;

type FeaturedProject = {
  id: string;
  title: string;
  description: string;
  companyName: string;
  isApplied?: boolean;
  skills: Array<{
    id: string;
    label: string;
  }>;
};

interface HomeDashboardClientProps {
  paymentSummary: {
    formattedAwaitingPayment: string;
    formattedHoursWorked: string;
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
    question: "Where can I see my hours and payment status?",
    answer:
      "The home page gives a quick summary of your hours worked and awaiting payment. For the full account record, including balances, ledger history, transfers, and withdrawals, use the wallet page.",
  },
  {
    question: "Why does some money show as awaiting payment?",
    answer:
      "Awaiting payment means the work has been recorded but the money is still being held until the required review, eligibility, or verification step is complete. This keeps the payout process traceable and easier to audit.",
  },
  {
    question: "What should I do if my progress looks incorrect?",
    answer:
      "Check your project status, submitted work, and wallet records first. If the numbers still do not match your work, contact support with the project name and the hours or payment record you expected to see.",
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
  const visibleProjects = projects;
  const [activeTab, setActiveTab] = useState<"projects" | "applications">(
    "projects",
  );
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "submitted" | "error"
  >("idle");
  const [submittedProjectIds, setSubmittedProjectIds] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [referralCopied, setReferralCopied] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportChatMessage[]>([
    {
      from: "support",
      text: "Hi — what are you trying to sort out today? I can help with a task, application, payment, or account issue.",
    },
  ]);
  const [supportTopic, setSupportTopic] = useState<SupportTopic>();

  const toggleProjectActions = (projectId: string) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
      setSelectedFile(null);
      setTaskNotes("");
      setSubmissionStatus("idle");
      return;
    }

    setExpandedProjectId(projectId);
    setSelectedFile(null);
    setTaskNotes("");
    setSubmissionStatus("idle");
  };

  const submitProjectWork = async (project: DashboardProject) => {
    if (!project.canSubmit || !project.applicationId || !selectedFile) {
      return;
    }

    setSubmissionStatus("submitting");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("notes", taskNotes);

      const response = await fetch(
        `/api/v1/applications/${project.applicationId}/task-submission`,
        {
          body: formData,
          method: "POST",
        },
      );

      if (!response.ok) {
        setSubmissionStatus("error");
        return;
      }

      setSubmittedProjectIds((current) =>
        current.includes(project.id) ? current : [...current, project.id],
      );
      setSelectedFile(null);
      setTaskNotes("");
      setSubmissionStatus("submitted");
    } catch {
      setSubmissionStatus("error");
    }
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
    <div className="home-dashboard flex flex-col items-start gap-9 lg:flex-row lg:gap-10">
      {/* Main Left Column */}
      <div className="min-w-0 flex-1 space-y-9">
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

      {/* Greeting & Refer Button */}
      <div className="flex flex-wrap items-end justify-between gap-5 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
            Overview
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-brand-ink md:text-[42px]">
          Welcome back, {userName}
          </h1>
        </div>
        <Link
          href="/referral"
          className="inline-flex items-center gap-2 rounded-[10px] border border-brand-sand bg-brand-ivory px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-sm transition hover:border-brand-gold/60 hover:bg-[var(--color-accent-soft)] active:scale-[0.98]"
        >
          <UserPlus className="h-4 w-4 text-slate-700" strokeWidth={2} />
          <span>Refer &amp; Earn</span>
        </Link>
      </div>

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
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
                Open roles
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-ink">
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
              const cardClassName = `flex min-h-[190px] flex-col justify-between rounded-[18px] border bg-brand-ivory p-5 text-left shadow-brand-card ${
                project.isApplied
                  ? "border-brand-gold/50"
                  : "group border-brand-sand transition hover:-translate-y-0.5 hover:border-brand-gold/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
              } ${project.id === featuredProjects[0]?.id ? "md:col-span-2" : ""}`;
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
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-brand-muted">
                      {project.description}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-1.5">
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
      <div className="pt-2">
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
          <section className="space-y-4">
            <div className="flex items-center justify-between">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleProjects.map((project) => {
                const isApplied = project.isApplied !== false;
                const hasSubmitted =
                  project.isSubmitted || submittedProjectIds.includes(project.id);
                const canUpload = Boolean(project.canSubmit) && !hasSubmitted;
                const isExpanded = expandedProjectId === project.id;

                return (
                  <article
                    className={`flex min-h-[160px] flex-col justify-between rounded-[18px] border bg-brand-ivory p-5 text-left shadow-brand-card transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      isApplied
                        ? "border-brand-gold/50"
                        : "border-brand-sand hover:border-brand-gold/60"
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
                      <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 font-semibold text-brand-gold-strong">
                        {hasSubmitted ? "Submitted for review" : project.statusLabel}
                      </span>
                      <span className="font-medium text-slate-600">
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
                          <button
                            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-brand-sand bg-brand-ivory px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-gold/60 hover:bg-[var(--color-accent-soft)] focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canUpload}
                            onClick={() => toggleProjectActions(project.id)}
                            type="button"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {hasSubmitted
                              ? "Submitted"
                              : isExpanded
                                ? "Hide upload"
                                : "Upload completed work"}
                          </button>
                        </div>

                        {isExpanded && canUpload ? (
                          <div className="mt-3 grid gap-3 rounded-[12px] border border-brand-sand bg-[#f1ebdf] p-3">
                            <label
                              className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-dashed border-brand-gold/60 bg-brand-ivory px-3 py-2.5 transition hover:border-brand-gold hover:bg-[var(--color-accent-soft)]"
                              htmlFor={`task-file-${project.id}`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Upload className="h-4 w-4 shrink-0 text-brand-gold-strong" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-brand-ink">
                                    {selectedFile?.name ?? "Choose completed file"}
                                  </span>
                                  <span className="block text-xs text-brand-muted">
                                    Up to 4 MB
                                  </span>
                                </span>
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-brand-gold-strong">
                                Browse
                              </span>
                            </label>
                            <input
                              accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip,.png,.jpg,.jpeg"
                              className="sr-only"
                              id={`task-file-${project.id}`}
                              onChange={(event) =>
                                setSelectedFile(event.target.files?.[0] ?? null)
                              }
                              type="file"
                            />
                            {selectedFile &&
                            selectedFile.size > MAX_TASK_SUBMISSION_BYTES ? (
                              <p className="text-xs font-semibold text-red-600">
                                This file is larger than the 4 MB upload limit.
                              </p>
                            ) : null}
                            <label className="block">
                              <span className="text-xs font-semibold text-slate-600">
                                Notes for reviewers
                              </span>
                              <textarea
                                className="mt-1 min-h-20 w-full rounded-[10px] border border-brand-sand bg-brand-ivory px-3 py-2 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                                onChange={(event) =>
                                  setTaskNotes(event.target.value)
                                }
                                placeholder="Add a short note about the completed work."
                                value={taskNotes}
                              />
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-brand-ink px-3 text-xs font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={
                                  !selectedFile ||
                                  selectedFile.size > MAX_TASK_SUBMISSION_BYTES ||
                                  submissionStatus === "submitting"
                                }
                                onClick={() => {
                                  void submitProjectWork(project);
                                }}
                                type="button"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                {submissionStatus === "submitting"
                                  ? "Uploading"
                                  : "Submit completed work"}
                              </button>
                              {submissionStatus === "submitted" ? (
                                <span className="text-xs font-semibold text-emerald-700">
                                  Submitted for review.
                                </span>
                              ) : null}
                              {submissionStatus === "error" ? (
                                <span className="text-xs font-semibold text-red-600">
                                  Upload failed. Check the file or link and try again.
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : (
          <section className="space-y-4">
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
                          <span className="rounded-full bg-[#f2e8d7] px-2.5 py-1 text-xs font-semibold text-brand-gold-strong">
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
                        <span className="text-sm font-semibold text-slate-700">
                          {application.payoutLabel}
                        </span>
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

        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-ink">
                Frequently asked questions
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Quick answers about projects, hours, payments, safety, and what
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
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-brand-ink transition hover:bg-[#f2e8d7] [&::-webkit-details-marker]:hidden">
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

      {/* Right Column Sidebar */}
      <aside className="w-full shrink-0 space-y-6 lg:w-[320px]">
        {/* Payments Summary Card */}
        <div className="overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-sm">
          <div className="border-b border-brand-sand bg-[#f1ebdf] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Wallet className="h-4 w-4 text-slate-400" />
                Payments
              </div>
              <Link
                href="/wallet"
                className="text-xs font-semibold text-brand-gold-strong transition hover:text-brand-ink hover:underline"
              >
                Wallet
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  Total hours
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="mt-1 text-2xl font-bold text-brand-ink">
                  {paymentSummary.formattedHoursWorked}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  Expected earnings
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <div className="mt-1 text-2xl font-bold text-brand-gold-strong">
                  {paymentSummary.formattedAwaitingPayment}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refer Card */}
        <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e8d7]">
              <UserPlus className="h-5 w-5 text-brand-gold-strong" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Refer and earn up to $300
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Earn money by inviting others to the platform.{" "}
                <Link
                  href="/help-center/policies"
                  className="font-medium text-slate-700 hover:underline"
                >
                  View terms
                </Link>
              </p>
              <button
                type="button"
                onClick={copyReferralLink}
                disabled={!referralLink}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-sand bg-brand-ivory py-2 text-xs font-semibold text-brand-ink shadow-sm transition hover:border-brand-gold/60 hover:bg-[#f2e8d7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {referralCopied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy referral link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Try Versus Card */}
        <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
              <span className="text-sm font-bold text-brand-gold-light">VS</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Try Versus
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Get free access to premium AI models and compare which responses work best for you
              </p>
              <Link
                href="/apply"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-sand bg-brand-ivory py-2 text-xs font-semibold text-brand-ink shadow-sm transition hover:border-brand-gold/60 hover:bg-[#f2e8d7]"
              >
                Try now
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

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
                {["Payment status", "Can’t sign in", "Task question", "Safety concern"].map(
                  (topic) => (
                    <button
                      className="rounded-full border border-brand-sand bg-brand-ivory px-3 py-1.5 text-xs font-medium text-brand-muted transition hover:border-brand-gold hover:bg-[#f2e8d7] hover:text-brand-ink"
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
