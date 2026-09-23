"use client";

import { FormEvent, useState } from "react";

type FormState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Unable to create job";
}

export function JobCreateForm() {
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Saving" });

    const formData = new FormData(event.currentTarget);
    const payoutDollars = Number(formData.get("payoutDollars") ?? 0);
    const hourlyMinValue = String(formData.get("hourlyMinDollars") ?? "");
    const hourlyMaxValue = String(formData.get("hourlyMaxDollars") ?? "");
    const hourlyMinDollars = hourlyMinValue ? Number(hourlyMinValue) : null;
    const hourlyMaxDollars = hourlyMaxValue ? Number(hourlyMaxValue) : null;
    const skills = String(formData.get("skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const response = await fetch("/api/v1/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        payoutAmountCents: Math.round(payoutDollars * 100),
        payoutType: String(formData.get("payoutType") ?? "HOURS_10"),
        currency: String(formData.get("currency") ?? "USD"),
        companyName: String(formData.get("companyName") ?? "Trinity-AI"),
        openings: Number(formData.get("openings") ?? 1),
        hourlyMinCents:
          hourlyMinDollars === null ? null : Math.round(hourlyMinDollars * 100),
        hourlyMaxCents:
          hourlyMaxDollars === null ? null : Math.round(hourlyMaxDollars * 100),
        isHighDemand: formData.get("isHighDemand") === "on",
        skills,
      }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(payload) });
      return;
    }

    event.currentTarget.reset();
    setState({ status: "success", message: "Job created" });
    window.location.reload();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <input
        className="h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        name="title"
        placeholder="Title"
        required
      />
      <input
        className="h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        defaultValue="Trinity-AI"
        name="companyName"
        placeholder="Company"
        required
      />
      <textarea
        className="min-h-28 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 py-2 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        name="description"
        placeholder="Description"
        required
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          min={1}
          name="payoutDollars"
          placeholder="Payout"
          required
          step="1"
          type="number"
        />
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          min={1}
          name="hourlyMinDollars"
          placeholder="Hourly min"
          step="1"
          type="number"
        />
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          min={1}
          name="hourlyMaxDollars"
          placeholder="Hourly max"
          step="1"
          type="number"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          defaultValue={1}
          min={1}
          name="openings"
          placeholder="Openings"
          required
          step="1"
          type="number"
        />
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm uppercase outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          defaultValue="USD"
          maxLength={3}
          minLength={3}
          name="currency"
          required
        />
        <select
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          name="payoutType"
        >
          <option value="HOURS_10">10 hours</option>
          <option value="TASK_1">1 task</option>
        </select>
      </div>
      <input
        className="h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
        name="skills"
        placeholder="Skills, comma separated"
      />
      <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
        <input className="h-4 w-4 accent-brand-gold" name="isHighDemand" type="checkbox" />
        High demand
      </label>
      <button
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:opacity-50"
        disabled={state.status === "submitting"}
        type="submit"
      >
        Create job
      </button>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm font-medium text-red-700"
              : "text-sm font-medium text-brand-gold-strong"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
