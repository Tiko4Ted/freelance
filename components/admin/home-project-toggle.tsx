"use client";

import { useState } from "react";

type HomeProjectToggleProps = {
  jobId: string;
  openings: number;
  showOnHome: boolean;
};

export function HomeProjectToggle({
  jobId,
  openings,
  showOnHome,
}: HomeProjectToggleProps) {
  const [isFeatured, setIsFeatured] = useState(showOnHome);
  const [remainingSpots, setRemainingSpots] = useState(String(openings));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateJob(data: { openings?: number; showOnHome?: boolean }) {
    const response = await fetch(`/api/v1/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("JOB_UPDATE_FAILED");
    }
  }

  async function toggleHomePlacement() {
    const nextValue = !isFeatured;
    setIsSaving(true);
    setError("");

    try {
      await updateJob({ showOnHome: nextValue });
      setIsFeatured(nextValue);
    } catch {
      setError("Unable to update home placement");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRemainingSpots() {
    const nextOpenings = Number(remainingSpots);

    if (!Number.isInteger(nextOpenings) || nextOpenings < 1) {
      setError("Participant spots must be a positive whole number");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateJob({ openings: nextOpenings });
      setRemainingSpots(String(nextOpenings));
    } catch {
      setError("Unable to update participant spots");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <button
          className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50 ${
            isFeatured
              ? "bg-brand-gold text-brand-ink hover:bg-[#a57846]"
              : "border border-brand-sand bg-brand-canvas text-brand-ink hover:border-brand-gold/60"
          }`}
          disabled={isSaving}
          onClick={toggleHomePlacement}
          type="button"
        >
          {isSaving
            ? "Saving"
            : isFeatured
              ? "Shown on home"
              : "Show on home"}
        </button>
        <label className="grid gap-1 text-xs font-semibold text-brand-muted">
          Remaining participant spots
          <input
            className="h-9 w-28 rounded-lg border border-brand-sand bg-brand-canvas px-2 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            min={1}
            onChange={(event) => setRemainingSpots(event.target.value)}
            step={1}
            type="number"
            value={remainingSpots}
          />
        </label>
        <button
          className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-sand bg-brand-canvas px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-gold/60 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          onClick={saveRemainingSpots}
          type="button"
        >
          Save spots
        </button>
      </div>
      {error ? (
        <span className="text-xs font-medium text-red-700">{error}</span>
      ) : null}
    </div>
  );
}
