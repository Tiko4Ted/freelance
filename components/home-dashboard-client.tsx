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
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  payoutLabel: string;
  payoutType: string;
  skills: string[];
  canSubmit: boolean;
  isSubmitted: boolean;
  submittedFileName?: string | null;
  briefHref?: string;
};

interface HomeDashboardClientProps {
  paymentSummary: {
    formattedAwaitingPayment: string;
    formattedHoursWorked: string;
  };
  projects?: DashboardProject[];
  userName?: string;
}

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
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          href="https://freelance-nu-swart.vercel.app/help-center"
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
  projects = [],
  userName = "Teddy",
}: HomeDashboardClientProps) {
  const fallbackProjects: DashboardProject[] = [
    {
      id: "demo-artifacts",
      title: "Project Artifacts",
      description: "Submit files for review.",
      status: "DEMO",
      statusLabel: "Ready to preview",
      payoutLabel: "Task review",
      payoutType: "Demo flow",
      skills: ["Files", "Review", "Documentation"],
      canSubmit: false,
      isSubmitted: false,
    },
    {
      id: "demo-rewrite",
      title: "Project Rewrite",
      description: "Improve AI-written text.",
      status: "DEMO",
      statusLabel: "Ready to preview",
      payoutLabel: "$10.00/task",
      payoutType: "Demo flow",
      skills: ["Writing", "AI review", "Editing"],
      canSubmit: false,
      isSubmitted: false,
    },
    {
      id: "demo-aid",
      title: "Project Aid",
      description: "Answer structured support and reasoning tasks.",
      status: "DEMO",
      statusLabel: "Ready to preview",
      payoutLabel: "$10.00/task",
      payoutType: "Demo flow",
      skills: ["Research", "Reasoning", "Quality"],
      canSubmit: false,
      isSubmitted: false,
    },
  ];
  const visibleProjects = projects.length ? projects : fallbackProjects;
  const [activeTab, setActiveTab] = useState<"projects" | "applications">(
    "projects",
  );
  const [selectedProjectId, setSelectedProjectId] = useState(
    visibleProjects[0]?.id ?? "",
  );
  const [workspaceMode, setWorkspaceMode] = useState<"brief" | "work">("brief");
  const [taskFileName, setTaskFileName] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "submitted" | "error"
  >("idle");
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pendingPaused: false,
    pastProjects: false,
    hidden: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedProject =
    visibleProjects.find((project) => project.id === selectedProjectId) ??
    visibleProjects[0];

  const openProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setWorkspaceMode("brief");
    setSubmissionStatus("idle");
  };

  const submitProjectTask = async () => {
    if (!selectedProject?.applicationId || !selectedProject.canSubmit) {
      return;
    }

    setSubmissionStatus("submitting");

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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[34px]">
          Welcome back, {userName}
        </h1>
        <Link
          href="/referral"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
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
          className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-slate-300 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#eff6ff]">
              <ClipboardList
                className="h-6 w-6 text-[#2563eb]"
                strokeWidth={2}
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 transition group-hover:text-blue-600">
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
        <div className="inline-flex rounded-full border border-slate-200/70 bg-slate-100/90 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "projects"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeTab === "applications"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800"
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
              <h2 className="text-lg font-bold text-slate-900">
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
                  <button
                    className={`flex min-h-[160px] flex-col justify-between rounded-2xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSelected
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                    key={project.id}
                    onClick={() => openProject(project.id)}
                    type="button"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {project.title}
                        </h3>
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {project.description}
                      </p>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                        {project.statusLabel}
                      </span>
                      <span className="font-medium text-slate-600">
                        {project.payoutLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
              {/* Card 1: Project Artifacts */}
              <div className="hidden min-h-[136px] flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:shadow-md">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Project Artifacts
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Submit files for review.
                  </p>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-[#2563eb]">
                    New
                  </span>
                </div>
              </div>

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
                  <span className="font-semibold text-[#2563eb]">New</span>
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
                  <span className="font-semibold text-[#2563eb]">New</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-medium text-slate-600">
                    $10.00/task
                  </span>
                </div>
              </div>
            </div>

            {selectedProject ? (
              <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
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
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        href={selectedProject.briefHref}
                      >
                        <Download className="h-4 w-4" />
                        Download brief
                      </a>
                    ) : null}
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                      onClick={() => setWorkspaceMode("work")}
                      type="button"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start task
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
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          key={title}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-sm">
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

                    {workspaceMode === "brief" ? (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                          <div>
                            <h4 className="text-sm font-bold text-blue-950">
                              Project brief
                            </h4>
                            <p className="mt-1 text-sm leading-6 text-blue-900">
                              Start by downloading the brief, checking the
                              deliverables, and preparing the completed file.
                              When your work is ready, use Start task to open
                              the submission step.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 p-4">
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
                              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              onChange={(event) =>
                                setTaskFileName(event.target.value)
                              }
                              placeholder="completed-work.pdf"
                              value={taskFileName}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-semibold text-slate-600">
                              Notes for reviewers
                            </span>
                            <textarea
                              className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              onChange={(event) =>
                                setTaskNotes(event.target.value)
                              }
                              placeholder="Mention what you completed, any assumptions, and anything reviewers should know."
                              value={taskNotes}
                            />
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

                  <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
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

          {/* Collapsible Accordion Sections */}
          <div className="space-y-3 pt-3">
            {/* Accordion 1: Pending & paused (1) */}
            <div className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("pendingPaused")}
                className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                <span>
                  Pending &amp; paused{" "}
                  <span className="font-normal text-slate-400">(1)</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    openSections.pendingPaused ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {openSections.pendingPaused ? (
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-xs text-slate-500 shadow-xs">
                  1 task awaiting client review and verification.
                </div>
              ) : null}
            </div>

            {/* Accordion 2: Past projects (2) */}
            <div className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("pastProjects")}
                className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                <span>
                  Past projects{" "}
                  <span className="font-normal text-slate-400">(2)</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    openSections.pastProjects ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {openSections.pastProjects ? (
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-xs text-slate-500 shadow-xs">
                  2 completed project contracts archived.
                </div>
              ) : null}
            </div>

            {/* Accordion 3: Hidden (0) */}
            <div className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection("hidden")}
                className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                <span>
                  Hidden{" "}
                  <span className="font-normal text-slate-400">(0)</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    openSections.hidden ? "rotate-180" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              {openSections.hidden ? (
                <div className="rounded-xl border border-slate-200/70 bg-white p-4 text-xs text-slate-500 shadow-xs">
                  No hidden projects.
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
          <p className="text-sm text-slate-500">
            View and manage your job applications on the{" "}
            <Link href="/apply" className="font-semibold text-blue-600 hover:underline">
              Apply
            </Link>{" "}
            page.
          </p>
        </section>
        )}

        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Frequently asked questions
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Quick answers about projects, hours, payments, safety, and what
                to check next.
              </p>
            </div>
            <Link
              href="/about-us"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              Learn more
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {faqs.map((faq) => (
              <details
                className="group border-b border-slate-200/70 last:border-b-0"
                key={faq.question}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
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
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Wallet className="h-4 w-4 text-slate-400" />
                Payments
              </div>
              <Link
                href="/wallet"
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
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
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {paymentSummary.formattedHoursWorked}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  Expected earnings
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {paymentSummary.formattedAwaitingPayment}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refer Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <UserPlus className="h-5 w-5 text-teal-600" />
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
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
                <ClipboardList className="h-3.5 w-3.5" />
                Copy referral link
              </button>
            </div>
          </div>
        </div>

        {/* Try Versus Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900">
              <span className="text-sm font-bold text-[#a3e635]">VS</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Try Versus
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Get free access to premium AI models and compare which responses work best for you
              </p>
              <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900">
                Try now
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {helpOpen ? (
          <div className="w-[calc(100vw-3rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
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
                        ? "bg-[#0066cc] text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {["Payment issue", "Onboarding help", "Task question"].map(
                  (topic) => (
                    <button
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) => setSupportMessage(event.target.value)}
                  placeholder="Type your question"
                  value={supportMessage}
                />
                <button
                  aria-label="Send support message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0066cc] text-white transition hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:opacity-50"
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
          className="flex h-14 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
