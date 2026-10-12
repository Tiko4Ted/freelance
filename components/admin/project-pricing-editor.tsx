"use client";

import { FormEvent, useState } from "react";

type ProjectPricingEditorProps = {
  applicationCount: number;
  currency: string;
  isActive: boolean;
  jobId: string;
  payoutAmountCents: number;
  payoutType: string;
};

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amountCents / 100);
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(2)}`;
  }
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

  return "Unable to update project pricing";
}

export function ProjectPricingEditor({
  applicationCount,
  currency,
  isActive,
  jobId,
  payoutAmountCents,
  payoutType,
}: ProjectPricingEditorProps) {
  const [payoutDollars, setPayoutDollars] = useState((payoutAmountCents / 100).toFixed(2));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const parsedDollars = Number(payoutDollars);
    const payoutAmount = Math.round(parsedDollars * 100);
    if (!Number.isFinite(parsedDollars) || payoutAmount <= 0) {
      setError("Enter a positive payout amount.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/admin/jobs/${jobId}`, {
        body: JSON.stringify({ payoutAmountCents: payoutAmount }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      setMessage(`Saved. New applicants will see ${formatMoney(payoutAmount, currency)}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update project pricing");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-brand-sand bg-brand-canvas/45 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-ink">Project pricing</p>
          <p className="mt-1 text-xs leading-5 text-brand-muted">
            Current rate: {formatMoney(payoutAmountCents, currency)} {payoutType === "TASK_1" ? "per task" : "for 10 hours"}.
          </p>
        </div>
        {isActive ? (
          <form className="flex flex-wrap items-end gap-2" onSubmit={savePricing}>
            <label className="grid gap-1 text-xs font-semibold text-brand-muted">
              New rate ({currency})
              <input
                className="h-9 w-28 rounded-lg border border-brand-sand bg-brand-ivory px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                min="0.01"
                onChange={(event) => setPayoutDollars(event.target.value)}
                step="0.01"
                type="number"
                value={payoutDollars}
              />
            </label>
            <button
              className="inline-flex h-9 items-center justify-center rounded-lg border border-brand-ink px-3 text-xs font-semibold text-brand-ink transition hover:bg-brand-ink hover:text-brand-ivory disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving" : "Save price"}
            </button>
          </form>
        ) : null}
      </div>
      <p className="mt-2 text-xs leading-5 text-brand-muted">
        {applicationCount > 0
          ? `${applicationCount} existing application${applicationCount === 1 ? "" : "s"} keep${applicationCount === 1 ? "s" : ""} the rate locked when submitted. Only new applicants use a changed price.`
          : "No applications are linked yet, so this price will apply to the first applicants."}
      </p>
      {message ? <p className="mt-2 text-xs font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}
