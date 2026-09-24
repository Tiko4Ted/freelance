"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  UserPlus,
  ClipboardList,
  ChevronRight,
  Info,
  ChevronDown,
  Wallet,
  MessageCircle,
  Send,
  X,
  Download,
  FileText,
  PlayCircle,
  Upload,
  CheckCircle2,
} from "lucide-react";

type DashboardProject = {
  id: string;
  applicationId?: string;
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
  canSubmit: boolean;
  isSubmitted: boolean;
  submittedFileName?: string | null;
  briefHref?: string;
  taskBrief: Array<{
    heading: string;
    lines: string[];
  }>;
};

interface HomeDashboardClientProps {
  paymentSummary: {
    formattedAwaitingPayment: string;
    formattedHoursWorked: string;
  };
  projects?: DashboardProject[];
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
          href="https://freelance-nu-swart.vercel.app/help-center"
        >
          Help Center fraud and account safety guide
        </Link>
        .
      </>
    ),
  },
];

const demoProjectBriefs: Record<string, DashboardProject["taskBrief"]> = {
  "demo-rewrite": [
    {
      heading: "Before you start",
      lines: [
        "Choose a short AI-written sample that needs clearer structure, tone, or factual caution.",
        "Estimated time: 45 to 60 minutes including editing and notes.",
      ],
    },
    {
      heading: "Task to complete",
      lines: [
        "Rewrite the sample so it sounds natural, accurate, and useful to the intended reader.",
        "Keep a short note showing the main edits you made and why.",
      ],
    },
    {
      heading: "What to submit",
      lines: [
        "A document or link containing the original text, rewritten version, and edit notes.",
        "A reviewer note covering tone, clarity, accuracy checks, and any unresolved assumptions.",
      ],
    },
    {
      heading: "Review checklist",
      lines: [
        "The rewrite is clearer than the source text.",
        "Changes are explained with practical editing judgment.",
        "Any uncertain claims are flagged instead of silently rewritten.",
      ],
    },
  ],
  "demo-aid": [
    {
      heading: "Before you start",
      lines: [
        "Read the support scenario and identify the user's goal, missing facts, and safest next step.",
        "Estimated time: 45 to 75 minutes for answers and reviewer notes.",
      ],
    },
    {
      heading: "Task to complete",
      lines: [
        "Answer three structured support prompts with clear reasoning and concise user-facing language.",
        "Flag any case where you would need more information before giving a final answer.",
      ],
    },
    {
      heading: "What to submit",
      lines: [
        "A completed answer sheet or share link.",
        "Notes describing your reasoning, assumptions, and escalation decisions.",
      ],
    },
    {
      heading: "Review checklist",
      lines: [
        "Answers are helpful, direct, and safe.",
        "Reasoning separates facts from assumptions.",
        "Escalation decisions are clear where the scenario is incomplete.",
      ],
    },
  ],
};

export function HomeDashboardClient({
  paymentSummary,
  projects = [],
  userName = "Teddy",
}: HomeDashboardClientProps) {
  const fallbackProjects: DashboardProject[] = [
    {
      id: "demo-rewrite",
      title: "Project Rewrite",
      description: "Improve AI-written text.",
      status: "DEMO",
      statusLabel: "Ready to preview",
      payoutLabel: "$10.00/task",
      payoutType: "Demo flow",
      applyHref: "/apply",
      skills: ["Writing", "AI review", "Editing"],
      canSubmit: true,
      isSubmitted: false,
      taskBrief: demoProjectBriefs["demo-rewrite"],
    },
    {
      id: "demo-aid",
      title: "Project Aid",
      description: "Answer structured support and reasoning tasks.",
      status: "DEMO",
      statusLabel: "Ready to preview",
      payoutLabel: "$10.00/task",
      payoutType: "Demo flow",
      applyHref: "/apply",
      skills: ["Research", "Reasoning", "Quality"],
      canSubmit: true,
      isSubmitted: false,
      taskBrief: demoProjectBriefs["demo-aid"],
    },
  ];
  const visibleProjects = projects.length ? projects : fallbackProjects;
  const [activeTab, setActiveTab] = useState<"projects" | "applications">(
    "projects",
  );
  const [workspaceMode, setWorkspaceMode] = useState<"brief" | "work">("brief");
  const [taskFileName, setTaskFileName] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "submitted" | "error"
  >("idle");
  const taskWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const taskInputRef = useRef<HTMLInputElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportMessages, setSupportMessages] = useState<
    Array<{ from: "support" | "user"; text: string }>
  >([
    {
      from: "support",
      text: "Hi, I can help with onboarding, payments, tasks, and account questions.",
    },
  ]);
  const selectedProject = visibleProjects[0];

  const startProjectTask = () => {
    setWorkspaceMode("work");
    setSubmissionStatus("idle");
  };

  useEffect(() => {
    if (workspaceMode !== "work") {
      return;
    }

    taskWorkspaceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    taskInputRef.current?.focus({ preventScroll: true });
  }, [workspaceMode, selectedProject?.id]);

  const submitProjectTask = async () => {
    if (!selectedProject?.canSubmit) {
      return;
    }

    setSubmissionStatus("submitting");

    if (!selectedProject.applicationId) {
      setSubmissionStatus("submitted");
      setTaskFileName("");
      setTaskNotes("");
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/applications/${selectedProject.applicationId}/task-submission`,
        {
          body: JSON.stringify({
            fileName: taskFileName,
            notes: taskNotes,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );

      if (response.ok) {
        setSubmissionStatus("submitted");
        setTaskFileName("");
        setTaskNotes("");
        return;
      }

      setSubmissionStatus("error");
    } catch {
      setSubmissionStatus("error");
    }
  };

  const sendSupportMessage = (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setSupportMessages((messages) => [
      ...messages,
      { from: "user", text: trimmedMessage },
      {
        from: "support",
        text: "Thanks. A support teammate can pick this up from here once live chat is connected.",
      },
    ]);
    setSupportMessage("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Main Left Column */}
      <div className="flex-1 space-y-8 min-w-0">
        {/* Yellow / Amber Notification Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Clock
            className="h-4 w-4 shrink-0 text-[#d97706]"
            strokeWidth={2}
          />
          <span className="text-sm font-medium text-[#78350f]">
            Application under review — We&apos;ll reach out once verified
          </span>
        </div>
        <Link
          href="/apply"
          className="text-sm font-semibold text-[#78350f] hover:underline"
        >
          View roles
        </Link>
      </div>

      {/* Greeting & Refer Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <h1 className="text-3xl font-bold tracking-tight text-brand-ink md:text-[34px]">
          Welcome back, {userName}
        </h1>
        <Link
          href="/referral"
          className="inline-flex items-center gap-2 rounded-xl border border-brand-sand bg-brand-ivory px-4 py-2 text-sm font-medium text-brand-ink shadow-sm transition hover:border-brand-gold/60 hover:bg-[#f2e8d7]"
        >
          <UserPlus className="h-4 w-4 text-slate-700" strokeWidth={2} />
          <span>Refer &amp; Earn</span>
        </Link>
      </div>

      {/* Pending Tasks */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider text-slate-500">
            PENDING TASKS
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-[11px] font-bold text-white shadow-xs">
            1
          </span>
        </div>

        <Link
          href="/onboarding"
          className="group flex items-center justify-between rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-[0_1px_3px_rgba(38,41,31,0.04)] transition hover:border-brand-gold/60 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-gold/35 bg-[#f2e8d7]">
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

      {/* Tabs: Projects / Applications */}
      <div className="pt-2">
        <div className="inline-flex rounded-full border border-brand-sand bg-[#ece5d8] p-1">
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
              <h2 className="text-lg font-bold text-brand-ink">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {visibleProjects.map((project) => {
                const isSelected = selectedProject?.id === project.id;

                return (
                  <Link
                    className={`flex min-h-[160px] flex-col justify-between rounded-2xl border bg-brand-ivory p-5 text-left shadow-[0_1px_2px_rgba(38,41,31,0.04)] transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      isSelected
                        ? "border-brand-gold ring-1 ring-brand-gold/25"
                        : "border-brand-sand hover:border-brand-gold/60"
                    }`}
                    href={project.applyHref ?? "/apply"}
                    key={project.id}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {project.title}
                        </h3>
                        {isSelected ? (
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
                      <span className="rounded-full bg-[#f2e8d7] px-2.5 py-1 font-semibold text-brand-gold-strong">
                        {project.statusLabel}
                      </span>
                      <span className="font-medium text-slate-600">
                        {project.payoutLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {/* Card 2: Project Rewrite */}
              <div className="hidden min-h-[136px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-md">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Project Rewrite
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Improve AI-written text.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-brand-gold-strong">New</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-600">
                    $10.00/task
                  </span>
                </div>
              </div>

              {/* Card 3: Project Aid */}
              <div className="hidden min-h-[136px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-md">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Project Aid
                  </h3>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-brand-gold-strong">New</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-600">
                    $10.00/task
                  </span>
                </div>
              </div>
            </div>

            {selectedProject ? (
              <section className="rounded-2xl border border-brand-sand bg-brand-ivory shadow-brand-card">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {selectedProject.statusLabel}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {selectedProject.payoutLabel}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-950">
                      {selectedProject.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      {selectedProject.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.briefHref ? (
                      <a
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-sand bg-brand-ivory px-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold/60 hover:bg-[#f2e8d7]"
                        href={selectedProject.briefHref}
                      >
                        <Download className="h-4 w-4" />
                        Download brief
                      </a>
                    ) : null}
                    <button
                      className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                        workspaceMode === "work"
                          ? "bg-brand-gold text-brand-ink hover:bg-[#a57846]"
                          : "bg-brand-ink text-brand-ivory hover:bg-[#35392c]"
                      }`}
                      onClick={startProjectTask}
                      type="button"
                    >
                      {workspaceMode === "work" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                      {workspaceMode === "work" ? "Task form open" : "Start task"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_280px]">
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        [
                          "Review brief",
                          "Open the task material and confirm the required deliverables.",
                        ],
                        [
                          "Do the work",
                          "Complete the task outside the dashboard using the client instructions.",
                        ],
                        [
                          "Submit proof",
                          "Upload the file name and notes so reviewers can process it.",
                        ],
                      ].map(([title, text], index) => (
                        <div
                          className="rounded-xl border border-brand-sand bg-[#f1ebdf] p-4"
                          key={title}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-ivory text-xs font-bold text-brand-ink shadow-sm">
                            {index + 1}
                          </div>
                          <h4 className="mt-3 text-sm font-bold text-slate-900">
                            {title}
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-brand-sand bg-brand-ivory p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-strong" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-950">
                            Task details
                          </h4>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Review these instructions before preparing your
                            file or share link.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        {selectedProject.taskBrief.map((section) => (
                          <section
                            className="rounded-xl border border-brand-sand bg-[#f1ebdf] p-4"
                            key={section.heading}
                          >
                            <h5 className="text-sm font-bold text-slate-900">
                              {section.heading}
                            </h5>
                            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                              {section.lines.map((line) => (
                                <li className="flex gap-2" key={line}>
                                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}
                      </div>
                    </div>

                    {workspaceMode === "brief" ? (
                      <div className="rounded-xl border border-brand-gold/35 bg-[#f2e8d7] p-4">
                        <div className="flex items-start gap-3">
                          <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold-strong" />
                          <div>
                            <h4 className="text-sm font-bold text-brand-ink">
                              Ready to work?
                            </h4>
                            <p className="mt-1 text-sm leading-6 text-brand-muted">
                              Use Start task when you have read the details and
                              are ready to enter the completed file or share
                              link for review.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-xl border border-brand-gold/45 bg-brand-ivory p-4 shadow-[0_0_0_3px_rgba(182,138,85,0.10)]"
                        ref={taskWorkspaceRef}
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-slate-700" />
                          <h4 className="text-sm font-bold text-slate-950">
                            Submit completed work
                          </h4>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-600">
                              File name or share link
                            </span>
                            <input
                              className="mt-1 h-11 w-full rounded-xl border border-brand-sand bg-brand-ivory px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                              onChange={(event) =>
                                setTaskFileName(event.target.value)
                              }
                              placeholder="completed-work.pdf"
                              ref={taskInputRef}
                              value={taskFileName}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-600">
                              Notes for reviewers
                            </span>
                            <textarea
                              className="mt-1 min-h-24 w-full rounded-xl border border-brand-sand bg-brand-ivory px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                              onChange={(event) =>
                                setTaskNotes(event.target.value)
                              }
                              placeholder="Mention what you completed, any assumptions, and anything reviewers should know."
                              value={taskNotes}
                            />
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                !selectedProject.canSubmit ||
                                !taskFileName.trim() ||
                                submissionStatus === "submitting"
                              }
                              onClick={() => {
                                void submitProjectTask();
                              }}
                              type="button"
                            >
                              <Upload className="h-4 w-4" />
                              {submissionStatus === "submitting"
                                ? "Submitting"
                                : "Submit work"}
                            </button>
                            {!selectedProject.canSubmit ? (
                              <span className="text-xs font-medium text-slate-500">
                                This project is not ready for submission yet.
                              </span>
                            ) : null}
                            {submissionStatus === "submitted" ? (
                              <span className="text-xs font-semibold text-emerald-700">
                                Submitted for review.
                              </span>
                            ) : null}
                            {submissionStatus === "error" ? (
                              <span className="text-xs font-semibold text-red-600">
                                Submission failed. Check the project status and
                                try again.
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <aside className="rounded-xl border border-brand-sand bg-[#f1ebdf] p-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      Project details
                    </h4>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Payment
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                          {selectedProject.payoutLabel}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Payment rule
                        </dt>
                        <dd className="mt-1 text-slate-700">
                          {selectedProject.payoutType}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">
                          Skills
                        </dt>
                        <dd className="mt-2 flex flex-wrap gap-2">
                          {selectedProject.skills.length ? (
                            selectedProject.skills.slice(0, 5).map((skill) => (
                              <span
                                className="rounded-full bg-brand-ivory px-2.5 py-1 text-xs font-semibold text-brand-muted"
                                key={skill}
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500">
                              Role-specific review
                            </span>
                          )}
                        </dd>
                      </div>
                      {selectedProject.isSubmitted ? (
                        <div>
                          <dt className="text-xs font-semibold text-slate-500">
                            Submitted file
                          </dt>
                          <dd className="mt-1 text-slate-700">
                            {selectedProject.submittedFileName ?? "Submitted"}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </aside>
                </div>
              </section>
            ) : null}
          </section>
        </>
      ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-brand-ink">
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

          <div className="overflow-hidden rounded-2xl border border-brand-sand bg-brand-ivory shadow-[0_1px_3px_rgba(38,41,31,0.04)]">
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
                  href="#"
                  className="font-medium text-slate-700 hover:underline"
                >
                  View terms
                </Link>
              </p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-sand bg-brand-ivory py-2 text-xs font-semibold text-brand-ink shadow-sm transition hover:border-brand-gold/60 hover:bg-[#f2e8d7]">
                <ClipboardList className="h-3.5 w-3.5" />
                Copy referral link
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
              <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-sand bg-brand-ivory py-2 text-xs font-semibold text-brand-ink shadow-sm transition hover:border-brand-gold/60 hover:bg-[#f2e8d7]">
                Try now
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
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
                  Chat with support about work, payments, or your account.
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
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-sand px-5 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {["Payment issue", "Onboarding help", "Task question"].map(
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
