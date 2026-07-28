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
    const response = await fetch("/api/v1/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        payoutAmountCents: Math.round(payoutDollars * 100),
        payoutType: String(formData.get("payoutType") ?? "HOURS_10"),
        currency: String(formData.get("currency") ?? "USD"),
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
        className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-teal-700"
        name="title"
        placeholder="Title"
        required
      />
      <textarea
        className="min-h-28 w-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700"
        name="description"
        placeholder="Description"
        required
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="h-10 border border-slate-300 px-3 text-sm outline-none focus:border-teal-700"
          min={1}
          name="payoutDollars"
          placeholder="Payout"
          required
          step="1"
          type="number"
        />
        <input
          className="h-10 border border-slate-300 px-3 text-sm uppercase outline-none focus:border-teal-700"
          defaultValue="USD"
          maxLength={3}
          minLength={3}
          name="currency"
          required
        />
        <select
          className="h-10 border border-slate-300 px-3 text-sm outline-none focus:border-teal-700"
          name="payoutType"
        >
          <option value="HOURS_10">10 hours</option>
          <option value="TASK_1">1 task</option>
        </select>
      </div>
      <button
        className="inline-flex h-10 w-full items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:bg-slate-400"
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
              : "text-sm font-medium text-teal-700"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
