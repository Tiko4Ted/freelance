"use client";

import { FormEvent, useState } from "react";

type ApplicationFormProps = {
  jobId: string;
};

type SubmitState =
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

  return "Unable to submit application";
}

export function ApplicationForm({ jobId }: ApplicationFormProps) {
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Submitting" });

    const formData = new FormData(event.currentTarget);
    const candidateName = String(formData.get("candidateName") ?? "");
    const candidateEmail = String(formData.get("candidateEmail") ?? "");

    const response = await fetch("/api/v1/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, candidateName, candidateEmail }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(payload) });
      return;
    }

    event.currentTarget.reset();
    setState({ status: "success", message: "Application submitted" });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="candidateName"
        >
          Candidate name
        </label>
        <input
          className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
          id="candidateName"
          name="candidateName"
          required
          minLength={2}
        />
      </div>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="candidateEmail"
        >
          Candidate email
        </label>
        <input
          className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
          id="candidateEmail"
          name="candidateEmail"
          required
          type="email"
        />
      </div>
      <button
        className="inline-flex h-11 w-full items-center justify-center border border-slate-950 bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={state.status === "submitting"}
        type="submit"
      >
        Submit application
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
