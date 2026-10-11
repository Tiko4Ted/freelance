"use client";

import { useState } from "react";

type ProjectLifecycleActionsProps = {
  jobId: string;
  isActive: boolean;
  applicationCount: number;
};

type CloseResponse = {
  error?: string;
  closedApplications?: number;
};

export function ProjectLifecycleActions({
  jobId,
  isActive,
  applicationCount,
}: ProjectLifecycleActionsProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function closeProject() {
    const confirmed = window.confirm(
      "Close this project? New applications will stop, unfinished applications will be closed, and task uploads will no longer be accepted. Submitted work already in review will be preserved.",
    );

    if (!confirmed) {
      return;
    }

    setIsClosing(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/v1/admin/jobs/" + jobId + "/close", {
        method: "POST",
      });
      const payload = (await response.json()) as CloseResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to close project");
      }

      setMessage(
        String(payload.closedApplications ?? 0) +
          " unfinished application" +
          (payload.closedApplications === 1 ? "" : "s") +
          " closed",
      );
      window.location.reload();
    } catch (closeError) {
      setError(
        closeError instanceof Error
          ? closeError.message
          : "Unable to close project",
      );
    } finally {
      setIsClosing(false);
    }
  }

  if (!isActive) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <p className="font-semibold text-slate-800">Project closed</p>
        <p className="mt-1 leading-5 text-slate-600">
          This record is retained for history. Create a new project when you
          want a fresh application pool.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50/70 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-red-900">Close project</p>
          <p className="mt-1 text-xs leading-5 text-red-800/80">
            Closes unfinished work and blocks task uploads. {applicationCount}{" "}
            application{applicationCount === 1 ? "" : "s"} currently linked.
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-3 text-xs font-semibold text-red-800 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/60 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isClosing}
          onClick={closeProject}
          type="button"
        >
          {isClosing ? "Closing" : "Close project"}
        </button>
      </div>
      {message ? (
        <p aria-live="polite" className="mt-2 text-xs font-medium text-red-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p aria-live="assertive" className="mt-2 text-xs font-medium text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
