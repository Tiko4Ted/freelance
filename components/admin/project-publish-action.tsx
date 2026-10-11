"use client";

import { useState } from "react";

type ProjectPublishActionProps = {
  jobId: string;
  isActive: boolean;
  showOnHome: boolean;
  hasTaskBrief: boolean;
  aptitudeQuestionCount: number;
};

export function ProjectPublishAction({
  jobId,
  isActive,
  showOnHome,
  hasTaskBrief,
  aptitudeQuestionCount,
}: ProjectPublishActionProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  if (!isActive || showOnHome) {
    return null;
  }

  const ready = hasTaskBrief && aptitudeQuestionCount >= 15;

  async function publish() {
    setIsPublishing(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/admin/jobs/${jobId}/publish`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to publish project");
      }
      window.location.reload();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Unable to publish project");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-gold/40 bg-[#f2e8d7]/65 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-ink">Draft project</p>
          <p className="mt-1 text-xs leading-5 text-brand-muted">
            Brief {hasTaskBrief ? "ready" : "missing"} · Aptitude {aptitudeQuestionCount}/15 questions
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-ink px-3 text-xs font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!ready || isPublishing}
          onClick={publish}
          type="button"
        >
          {isPublishing ? "Publishing" : "Publish to users"}
        </button>
      </div>
      {!ready ? (
        <p className="mt-2 text-xs leading-5 text-amber-800">
          Add the PDF brief and all 15 aptitude questions before publishing.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
