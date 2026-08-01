"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { ReferralService } from "@/lib/services/referral-service";

type CandidateApplication = Awaited<
  ReturnType<typeof ReferralService.getCandidateApplications>
>[number];

type JobActivityListProps = {
  applications: CandidateApplication[];
};

type SubmissionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending approval" },
  { value: "active", label: "Ready to work" },
  { value: "review", label: "Pending task review" },
  { value: "successful", label: "Successful" },
  { value: "failed", label: "Failed" },
];

function statusLabel(application: CandidateApplication) {
  if (application.status === "APPLIED") {
    return "Pending approval";
  }

  if (application.status === "CERTIFYING") {
    return "Pending task review";
  }

  if (
    application.status === "ACTIVE" ||
    application.status === "MATCHED" ||
    application.status === "CERTIFIED"
  ) {
    return "Ready to work";
  }

  if (application.bucket === "successful") {
    return "Successful";
  }

  if (application.bucket === "failed") {
    return "Failed";
  }

  return "Pending";
}

function filterValue(application: CandidateApplication) {
  if (application.status === "APPLIED") {
    return "pending";
  }

  if (application.status === "CERTIFYING") {
    return "review";
  }

  if (
    application.status === "ACTIVE" ||
    application.status === "MATCHED" ||
    application.status === "CERTIFIED"
  ) {
    return "active";
  }

  return application.bucket;
}

function canSubmitTask(application: CandidateApplication) {
  return (
    !application.taskSubmittedAt &&
    ["ACTIVE", "MATCHED", "CERTIFIED"].includes(application.status)
  );
}

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Unable to submit task";
}

export function JobActivityList({ applications }: JobActivityListProps) {
  const [filter, setFilter] = useState("all");
  const [stateByApplication, setStateByApplication] = useState<
    Record<string, SubmissionState>
  >({});
  const filteredApplications = useMemo(() => {
    if (filter === "all") {
      return applications;
    }

    return applications.filter((application) => filterValue(application) === filter);
  }, [applications, filter]);

  function setApplicationState(id: string, state: SubmissionState) {
    setStateByApplication((current) => ({
      ...current,
      [id]: state,
    }));
  }

  async function submitTask(
    event: FormEvent<HTMLFormElement>,
    application: CandidateApplication,
  ) {
    event.preventDefault();

    if (
      !window.confirm(
        "Confirm that the work is complete and ready for review. You can only submit this task once.",
      )
    ) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("taskFile");

    if (!(file instanceof File) || !file.name) {
      setApplicationState(application.id, {
        status: "error",
        message: "Upload your completed task file before submitting.",
      });
      return;
    }

    setApplicationState(application.id, {
      status: "submitting",
      message: "Submitting completed task",
    });

    const response = await fetch(
      `/api/v1/applications/${application.id}/task-submission`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          notes: String(formData.get("notes") ?? ""),
        }),
      },
    );
    const payload: unknown = await response.json();

    if (!response.ok) {
      setApplicationState(application.id, {
        status: "error",
        message: getErrorMessage(payload),
      });
      return;
    }

    setApplicationState(application.id, {
      status: "success",
      message:
        "Task submitted. Your task is under review and you will get an email status update after review.",
    });
    window.location.reload();
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((item) => (
          <button
            className={
              filter === item.value
                ? "inline-flex h-9 items-center justify-center border border-slate-950 bg-slate-950 px-3 text-xs font-semibold text-white"
                : "inline-flex h-9 items-center justify-center border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-700"
            }
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-white">
        {filteredApplications.length ? (
          filteredApplications.map((application) => {
            const submissionState = stateByApplication[application.id];

            return (
              <article
                className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]"
                key={application.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-slate-950">
                      {application.job.title}
                    </h3>
                    <StatusBadge status={application.status} />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {statusLabel(application)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Applied {application.appliedAt}. Last updated{" "}
                    {application.updatedAt}.
                  </p>

                  {application.status === "APPLIED" ? (
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      Pending approval. Your application is awaiting internal
                      review.
                    </p>
                  ) : null}

                  {application.status === "CERTIFYING" ? (
                    <p className="mt-2 text-sm leading-6 text-teal-700">
                      Pending task review. Your task is under review and you
                      will get an email status update after review.
                    </p>
                  ) : null}

                  {canSubmitTask(application) ? (
                    <div className="mt-4 space-y-3">
                      <a
                        className="inline-flex h-10 items-center justify-center border border-slate-950 px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
                        href={`/api/v1/applications/${application.id}/task-material`}
                      >
                        {application.materialType === "instructions"
                          ? "Download task instructions"
                          : "Download task material"}
                      </a>
                      <form
                        className="grid gap-3 rounded border border-slate-200 bg-slate-50 p-3"
                        onSubmit={(event) => submitTask(event, application)}
                      >
                        <p className="text-sm leading-6 text-slate-600">
                          Review the downloaded instructions and tips before
                          submitting. Submit only after the work is complete.
                        </p>
                        <input
                          className="text-sm text-slate-700"
                          name="taskFile"
                          required
                          type="file"
                        />
                        <textarea
                          className="min-h-20 border border-slate-300 bg-white p-3 text-sm outline-none focus:border-teal-700"
                          name="notes"
                          placeholder="Optional submission notes"
                        />
                        <button
                          className="inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          disabled={submissionState?.status === "submitting"}
                          type="submit"
                        >
                          Submit completed task
                        </button>
                      </form>
                    </div>
                  ) : null}

                  {application.taskSubmittedAt ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Submitted {application.taskSubmittedAt}
                      {application.taskSubmissionFileName
                        ? `: ${application.taskSubmissionFileName}`
                        : ""}
                    </p>
                  ) : null}

                  {submissionState?.message ? (
                    <p
                      className={
                        submissionState.status === "error"
                          ? "mt-2 text-sm font-medium text-red-700"
                          : "mt-2 text-sm font-medium text-teal-700"
                      }
                    >
                      {submissionState.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid min-w-48 grid-cols-2 gap-3 text-sm">
                  <div className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">Hours</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {application.hoursLogged}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">Tasks</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {application.tasksCompleted}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="p-5">
            <h3 className="font-semibold text-slate-950">No job activity yet</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Applications you submit will appear here as pending approval while
              the team reviews your documents and confirms eligibility by email.
            </p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
              href="/jobs"
            >
              Browse jobs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
