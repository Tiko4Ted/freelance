"use client";

import { useState } from "react";

type ProjectPublishActionProps = {
  jobId: string;
  isActive: boolean;
  showOnHome: boolean;
  hasTaskBrief: boolean;
  aptitudeQuestionCount: number;
  publishedProjects: Array<{ id: string; title: string }>;
};

export function ProjectPublishAction({
  jobId,
  isActive,
  showOnHome,
  hasTaskBrief,
  aptitudeQuestionCount,
  publishedProjects,
}: ProjectPublishActionProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [replacePickerOpen, setReplacePickerOpen] = useState(false);
  const [replacementId, setReplacementId] = useState(publishedProjects[0]?.id ?? "");
  const [error, setError] = useState("");

  if (!isActive || showOnHome) {
    return null;
  }

  const ready = hasTaskBrief && aptitudeQuestionCount >= 15;

  async function publish() {
    if (publishedProjects.length >= 4 && !replacementId) {
      setReplacePickerOpen(true);
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      const shouldReplace = publishedProjects.length >= 4 && Boolean(replacementId);
      const response = await fetch(`/api/v1/admin/jobs/${jobId}/publish`, {
        body: shouldReplace ? JSON.stringify({ replaceJobId: replacementId }) : undefined,
        headers: shouldReplace ? { "Content-Type": "application/json" } : undefined,
        method: "POST",
      });
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
          onClick={() => {
            if (publishedProjects.length >= 4) {
              setReplacePickerOpen(true);
              return;
            }
            void publish();
          }}
          type="button"
        >
          {isPublishing
            ? "Publishing"
            : publishedProjects.length >= 4
              ? "Choose replacement"
              : "Publish to users"}
        </button>
      </div>
      {replacePickerOpen ? (
        <div className="mt-3 rounded-lg border border-brand-sand bg-brand-ivory p-3">
          <label className="grid gap-1 text-xs font-semibold text-brand-muted">
            Replace published project
            <select
              className="h-10 rounded-lg border border-brand-sand bg-brand-canvas px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              onChange={(event) => setReplacementId(event.target.value)}
              value={replacementId}
            >
              {publishedProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs leading-5 text-brand-muted">
            The selected project will close, preserving submitted work and ending unfinished work before this draft is published.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-ink px-3 text-xs font-semibold text-brand-ivory hover:bg-[#35392c] disabled:opacity-50"
              disabled={isPublishing || !replacementId}
              onClick={() => void publish()}
              type="button"
            >
              Replace and publish
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-sand bg-brand-canvas px-3 text-xs font-semibold text-brand-ink hover:border-brand-gold/60"
              onClick={() => setReplacePickerOpen(false)}
              type="button"
            >
              Keep as draft
            </button>
          </div>
        </div>
      ) : null}
      {!ready ? (
        <p className="mt-2 text-xs leading-5 text-amber-800">
          Add the PDF brief and all 15 aptitude questions before publishing.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
