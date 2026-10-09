"use client";

import Link from "next/link";
import { useState } from "react";

export type AnnotationModelOutput = {
  model_id?: string;
  text?: string;
};

export type AnnotationCriterion = {
  id: string;
  label: string;
  type: string;
  min?: number;
  max?: number;
  options?: string[];
};

type Props = {
  assignmentId: string;
  expiresAt: string;
  task: {
    project: {
      title: string;
      description: string;
      taskType: string;
      version: number;
      rubricSchema: { criteria?: AnnotationCriterion[] };
    };
    systemInstruction: string;
    prompt: string;
    constraints: Array<{ type: string; value: string }> | null;
    modelOutputs: Record<string, AnnotationModelOutput>;
  };
};

const preferenceOptions = [
  ["model_a_much_better", "Model A much better"],
  ["model_a_slightly_better", "Model A slightly better"],
  ["tie", "Tie"],
  ["model_b_slightly_better", "Model B slightly better"],
  ["model_b_much_better", "Model B much better"],
] as const;

export function HomeAnnotationWorkspace({
  assignmentId,
  expiresAt,
  task,
}: Props) {
  const [preference, setPreference] = useState("model_a_much_better");
  const [instructionFollowing, setInstructionFollowing] = useState("true");
  const [factuality, setFactuality] = useState("5");
  const [justification, setJustification] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/home-projects/assignments/${assignmentId}/submission`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluationData: {
              preference,
              constraint_checks: {
                model_a: { paragraph_count_passed: true, negative_constraint_passed: true },
                model_b: { paragraph_count_passed: true, negative_constraint_passed: false },
              },
              rubric_scores: {
                instruction_following: instructionFollowing === "true",
                factuality: Number(factuality),
              },
              justification,
            },
            timeSpentSeconds: startedAt
              ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
              : 1,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to submit this annotation");
      }

      setState("submitted");
    } catch (submissionError) {
      setState("error");
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit this annotation",
      );
    }
  }

  if (state === "submitted") {
    return (
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-10">
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Annotation submitted
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-brand-ink">
            Your evaluation is ready for review.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-900">
            The assignment is locked and the quality team can now review your
            preference, rubric scores, and evidence-based justification.
          </p>
          <Link
            className="mt-6 inline-flex rounded-[10px] bg-brand-ink px-4 py-2 text-sm font-semibold text-white"
            href="/home"
          >
            Return to home
          </Link>
        </div>
      </main>
    );
  }

  const outputEntries = Object.entries(task.modelOutputs);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-sm font-semibold text-brand-gold-strong hover:underline" href="/home">
            ← Back to home
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
            {task.project.taskType.replaceAll("_", " ")} · v{task.project.version}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-brand-ink">
            {task.project.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
            {task.project.description}
          </p>
        </div>
        <p className="rounded-full border border-brand-sand bg-brand-ivory px-3 py-2 text-xs font-semibold text-brand-muted">
          Assignment expires {new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <form
        className="space-y-5"
        onFocus={() => setStartedAt((current) => current ?? Date.now())}
        onSubmit={submit}
      >
        <section className="rounded-[20px] border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
            Task instructions
          </p>
          <p className="mt-3 text-sm font-medium leading-6 text-brand-ink">{task.systemInstruction}</p>
          <p className="mt-4 rounded-xl bg-[#f2efe8] p-4 text-sm leading-6 text-brand-ink">{task.prompt}</p>
          {task.constraints?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {task.constraints.map((constraint) => (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-brand-gold-strong" key={`${constraint.type}-${constraint.value}`}>
                  {constraint.type.replaceAll("_", " ")}: {constraint.value}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {outputEntries.map(([key, output]) => (
            <article className="rounded-[20px] border border-brand-sand bg-white p-5" key={key}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
                {key.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-xs text-brand-muted">{output.model_id}</p>
              <p className="mt-4 min-h-32 text-sm leading-7 text-brand-ink">{output.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[20px] border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">Rubric</p>
            <h2 className="mt-2 text-xl font-semibold text-brand-ink">Record an evidence-based judgment</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-brand-ink">
              Overall preference
              <select className="mt-2 w-full rounded-xl border border-brand-sand bg-white px-3 py-3 text-sm font-normal" value={preference} onChange={(event) => setPreference(event.target.value)}>
                {preferenceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-brand-ink">
              Instruction following
              <select className="mt-2 w-full rounded-xl border border-brand-sand bg-white px-3 py-3 text-sm font-normal" value={instructionFollowing} onChange={(event) => setInstructionFollowing(event.target.value)}>
                <option value="true">Passed</option>
                <option value="false">Failed</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-brand-ink">
              Factuality (1–5)
              <select className="mt-2 w-full rounded-xl border border-brand-sand bg-white px-3 py-3 text-sm font-normal" value={factuality} onChange={(event) => setFactuality(event.target.value)}>
                {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-brand-ink">
            Justification
            <textarea className="mt-2 min-h-32 w-full rounded-xl border border-brand-sand bg-white px-3 py-3 text-sm font-normal leading-6" minLength={10} maxLength={5000} required value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Cite the exact constraint or evidence that drove your decision." />
          </label>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          <button className="mt-5 rounded-[10px] bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-gold-strong disabled:cursor-not-allowed disabled:opacity-50" disabled={state === "submitting"} type="submit">
            {state === "submitting" ? "Submitting…" : "Submit annotation"}
          </button>
        </section>
      </form>
    </main>
  );
}
