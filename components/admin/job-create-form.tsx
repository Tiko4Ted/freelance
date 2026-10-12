"use client";

import { FormEvent, useState } from "react";

import { AptitudeTestBuilder } from "@/components/admin/aptitude-test-builder";

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
    const requestBody = new FormData();
    const copyFields = ["title", "companyName", "description", "currency", "payoutType", "openings", "skills", "aptitudeTest"];
    copyFields.forEach((field) => requestBody.set(field, String(formData.get(field) ?? "")));
    requestBody.set("payoutAmountCents", String(Math.round(Number(formData.get("payoutDollars") ?? 0) * 100)));
    const hourlyMinValue = String(formData.get("hourlyMinDollars") ?? "");
    const hourlyMaxValue = String(formData.get("hourlyMaxDollars") ?? "");
    requestBody.set("hourlyMinCents", hourlyMinValue ? String(Math.round(Number(hourlyMinValue) * 100)) : "");
    requestBody.set("hourlyMaxCents", hourlyMaxValue ? String(Math.round(Number(hourlyMaxValue) * 100)) : "");
    if (formData.get("isHighDemand") === "on") {
      requestBody.set("isHighDemand", "on");
    }
    const taskBrief = formData.get("taskBrief");
    if (taskBrief instanceof File && taskBrief.size > 0) {
      requestBody.set("taskBrief", taskBrief);
    }
    const response = await fetch("/api/v1/admin/jobs", {
      method: "POST",
      body: requestBody,
    });
    const responsePayload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(responsePayload) });
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
      <label className="grid gap-2 rounded-xl border border-dashed border-brand-gold/60 bg-[#f2e8d7]/50 p-4 text-sm font-semibold text-brand-ink">
        PDF project brief
        <input
          accept="application/pdf,.pdf"
          className="block w-full text-sm font-normal text-brand-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-ink file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-ivory"
          name="taskBrief"
          required
          type="file"
        />
        <span className="text-xs font-normal leading-5 text-brand-muted">
          This is the resource approved workers will download after they pass. PDF only, up to 4 MB.
        </span>
      </label>
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
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
          <input
            className="h-4 w-4 accent-brand-gold"
            name="isHighDemand"
            type="checkbox"
          />
          High demand
        </label>
        <p className="text-xs leading-5 text-brand-muted">
          New projects are saved as drafts. Publish them from the project list after reviewing the brief and test.
        </p>
      </div>
      <AptitudeTestBuilder />
      <button
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:opacity-50"
        disabled={state.status === "submitting"}
        type="submit"
      >
        Create draft project
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
