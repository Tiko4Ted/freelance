"use client";

import { ApplicationStatus } from "@prisma/client";
import { FormEvent, useState } from "react";

type BulkJob = {
  id: string;
  title: string;
  isActive: boolean;
};

type BulkOperation = {
  id: string;
  sourceStatus: ApplicationStatus | null;
  targetStatus: ApplicationStatus;
  jobTitle: string | null;
  olderThanHours: number | null;
  maxItems: number;
  scheduledAt: string;
  status: string;
  matchedCount: number;
  processedCount: number;
  changedCount: number;
  failedCount: number;
  lastError: string | null;
  completedAt: string | null;
  createdAt: string;
};

type Preview = {
  matchingCount: number;
  applications: Array<{
    id: string;
    candidateName: string;
    candidateEmail: string;
    status: ApplicationStatus;
    createdAt: string;
    jobTitle: string;
  }>;
};

type ApplicationBulkOperationsProps = {
  jobs: BulkJob[];
  operations: BulkOperation[];
};

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  CERTIFYING: "Task under review",
  CERTIFIED: "Approved / certified",
  MATCHED: "Matched",
  ACTIVE: "Active",
  PAYOUT_ELIGIBLE: "Payment eligible",
  PAID: "Paid",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
  CLOSED: "Closed / cancelled",
};

const statuses = Object.values(ApplicationStatus);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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

  return "Unable to complete the operation";
}

export function ApplicationBulkOperations({
  jobs,
  operations,
}: ApplicationBulkOperationsProps) {
  const [sourceStatus, setSourceStatus] = useState<ApplicationStatus | "">(
    ApplicationStatus.APPLIED,
  );
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>(
    ApplicationStatus.CERTIFIED,
  );
  const [jobId, setJobId] = useState("");
  const [olderThanHours, setOlderThanHours] = useState("");
  const [maxItems, setMaxItems] = useState("100");
  const [delayHours, setDelayHours] = useState("0");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "schedule" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function requestBody() {
    return {
      sourceStatus: sourceStatus || null,
      targetStatus,
      jobId: jobId || null,
      olderThanHours: olderThanHours ? Number(olderThanHours) : null,
      maxItems: Number(maxItems),
      delayHours: Number(delayHours),
    };
  }

  async function previewMatches(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy("preview");
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/v1/admin/applications/bulk/preview", {
        body: JSON.stringify(requestBody()),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as Preview & { error?: string };
      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }
      setPreview(payload);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview matches");
    } finally {
      setBusy(null);
    }
  }

  async function scheduleOperation() {
    setBusy("schedule");
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/v1/admin/applications/bulk", {
        body: JSON.stringify(requestBody()),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setMessage(
        Number(delayHours) > 0
          ? `Operation scheduled to run in ${delayHours} hours.`
          : "Operation queued. The page will remain usable while it runs.",
      );
      setPreview(null);
      window.location.reload();
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : "Unable to schedule operation");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
            Operations queue
          </p>
          <h2 className="mt-2 text-xl font-semibold text-brand-ink">Bulk application changes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
            Preview the oldest matching applications, then approve, reject, close, or move them to any supported state. Scheduled changes run in the background.
          </p>
        </div>
        <p className="max-w-xs text-xs leading-5 text-brand-muted">
          Existing task submissions and payout rules are handled by the same status safeguards as one-at-a-time changes.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]">
        <form className="grid min-w-0 gap-4" onSubmit={previewMatches}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-brand-ink">
              Current state
              <select
                className="h-11 min-w-0 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                onChange={(event) => {
                  setSourceStatus(event.target.value as ApplicationStatus | "");
                  setPreview(null);
                }}
                value={sourceStatus}
              >
                <option value="">Any current state</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-brand-ink">
              Change to
              <select
                className="h-11 min-w-0 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                onChange={(event) => {
                  setTargetStatus(event.target.value as ApplicationStatus);
                  setPreview(null);
                }}
                value={targetStatus}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-brand-ink">
            Project filter
            <select
              className="h-11 min-w-0 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              onChange={(event) => {
                setJobId(event.target.value);
                setPreview(null);
              }}
              value={jobId}
            >
              <option value="">All projects</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}{job.isActive ? "" : " (closed)"}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-brand-ink">
              Older than (hours)
              <input
                className="h-11 min-w-0 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                min="0"
                onChange={(event) => {
                  setOlderThanHours(event.target.value);
                  setPreview(null);
                }}
                placeholder="No age filter"
                type="number"
                value={olderThanHours}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-brand-ink">
              Max records
              <input
                className="h-11 min-w-0 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                max="500"
                min="1"
                onChange={(event) => {
                  setMaxItems(event.target.value);
                  setPreview(null);
                }}
                type="number"
                value={maxItems}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-brand-ink">
              Run after (hours)
              <input
                className="h-11 min-w-0 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                max="168"
                min="0"
                onChange={(event) => setDelayHours(event.target.value)}
                type="number"
                value={delayHours}
              />
            </label>
          </div>

          <p className="text-xs leading-5 text-brand-muted">
            The worker always re-checks these filters when it runs. A 72-hour delay means the operation will still act on the oldest records that match at execution time.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-ink px-4 text-sm font-semibold text-brand-ink transition hover:bg-brand-ink hover:text-brand-ivory disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy !== null}
              type="submit"
            >
              {busy === "preview" ? "Finding matches" : "Preview matches"}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy !== null || !preview}
              onClick={() => void scheduleOperation()}
              type="button"
            >
              {busy === "schedule" ? "Scheduling" : Number(delayHours) > 0 ? "Schedule change" : "Queue change"}
            </button>
          </div>
          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        </form>

        <div className="min-w-0 rounded-xl border border-brand-sand bg-brand-canvas/55 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-ink">Oldest matching applications</p>
              <p className="mt-1 text-xs text-brand-muted">
                {preview ? `${preview.matchingCount} match${preview.matchingCount === 1 ? "" : "es"} found` : "Run a preview to see the queue"}
              </p>
            </div>
            {preview ? <span className="text-2xl font-semibold text-brand-ink">{preview.matchingCount}</span> : null}
          </div>
          {preview?.applications.length ? (
            <div className="mt-4 space-y-3">
              {preview.applications.map((application) => (
                <div className="min-w-0 border-t border-brand-sand pt-3 first:border-t-0 first:pt-0" key={application.id}>
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-brand-ink">{application.candidateName}</p>
                    <span className="shrink-0 text-xs font-medium text-brand-muted">{statusLabels[application.status]}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-brand-muted">{application.candidateEmail}</p>
                  <p className="mt-1 text-xs text-brand-muted">{application.jobTitle} · {formatDate(application.createdAt)}</p>
                </div>
              ))}
              {preview.matchingCount > preview.applications.length ? (
                <p className="pt-1 text-xs font-medium text-brand-muted">Showing the first {preview.applications.length}. The queued operation is capped at {maxItems}.</p>
              ) : null}
            </div>
          ) : preview ? (
            <p className="mt-4 text-sm text-brand-muted">No applications match these filters.</p>
          ) : null}
        </div>
      </div>

      {operations.length ? (
        <div className="mt-8 border-t border-brand-sand pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-brand-ink">Recent bulk operations</h3>
            <p className="text-xs text-brand-muted">Newest first</p>
          </div>
          <div className="mt-3 grid gap-3">
            {operations.map((operation) => (
              <div className="min-w-0 rounded-xl border border-brand-sand bg-brand-canvas/40 p-4" key={operation.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-ink">
                    {operation.sourceStatus ? statusLabels[operation.sourceStatus] : "Any state"} to {statusLabels[operation.targetStatus]}
                  </p>
                  <span className="rounded-full bg-brand-ivory px-2.5 py-1 text-xs font-semibold text-brand-muted">{operation.status}</span>
                </div>
                <p className="mt-2 break-words text-xs leading-5 text-brand-muted">
                  {operation.jobTitle ?? "All projects"} · {operation.olderThanHours === null ? "Any age" : `older than ${operation.olderThanHours}h`} · limit {operation.maxItems} · scheduled {formatDate(operation.scheduledAt)}
                </p>
                <p className="mt-2 text-xs text-brand-muted">
                  {operation.changedCount} changed · {operation.processedCount}/{operation.matchedCount} processed{operation.failedCount ? ` · ${operation.failedCount} failed` : ""}
                </p>
                {operation.lastError ? <p className="mt-2 break-words text-xs font-medium text-red-700">Last issue: {operation.lastError}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
