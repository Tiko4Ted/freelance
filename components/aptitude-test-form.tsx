"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, ClipboardCheck, Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  ApplicationErrorDialog,
  ApplicationSubmissionPage,
  getErrorMessage,
  isApplicationPayload,
  type SubmitState,
} from "@/components/application-feedback";
import {
  applicationDraftStorageKey,
  type StoredApplicationDraft,
} from "@/lib/application-draft";
import type { AptitudeQuestion } from "@/lib/aptitude-test";

type AptitudeTestFormProps = {
  applicationHref: string;
  aptitudeTest: AptitudeQuestion[];
  jobId: string;
};

const toolOptions = [
  "Salesforce",
  "HubSpot",
  "Freshdesk",
  "Intercom",
  "Apollo",
  "Crayon",
  "Close",
  "Salesloft",
  "Shopify",
  "Funnel",
];

function NumberStepper({
  label,
  name,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  function setBoundedValue(nextValue: number) {
    onChange(Math.min(max, Math.max(min, nextValue)));
  }

  return (
    <div>
      <label className="text-[12px] font-medium text-brand-ink" htmlFor={name}>
        {label}
      </label>
      <div className="mt-2 grid h-10 grid-cols-[2.5rem_1fr_2.5rem] items-center rounded border border-brand-sand bg-brand-canvas/50 focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold">
        <button
          aria-label={`Decrease ${label}`}
          className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded bg-brand-ivory text-brand-gold-strong transition hover:bg-[#f2e8d7] focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
          onClick={() => setBoundedValue(value - 1)}
          type="button"
        >
          <Minus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <input
          className="h-full min-w-0 bg-transparent text-center text-[14px] font-semibold text-brand-ink outline-none"
          id={name}
          max={max}
          min={min}
          name={name}
          onChange={(event) => setBoundedValue(Number(event.target.value))}
          type="number"
          value={value}
        />
        <button
          aria-label={`Increase ${label}`}
          className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded bg-brand-ivory text-brand-gold-strong transition hover:bg-[#f2e8d7] focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
          onClick={() => setBoundedValue(value + 1)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function readStoredDraft(jobId: string): StoredApplicationDraft | null {
  const rawDraft = sessionStorage.getItem(applicationDraftStorageKey(jobId));

  if (!rawDraft) {
    return null;
  }

  try {
    const draft = JSON.parse(rawDraft) as Partial<StoredApplicationDraft>;

    if (draft.jobId !== jobId || !draft.candidateName) {
      return null;
    }

    return draft as StoredApplicationDraft;
  } catch {
    return null;
  }
}

export function AptitudeTestForm({
  applicationHref,
  aptitudeTest,
  jobId,
}: AptitudeTestFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startAvailabilityDays, setStartAvailabilityDays] = useState(1);
  const [expectedHourlyRateUsd, setExpectedHourlyRateUsd] = useState(1);
  const [weeklyAvailabilityHours, setWeeklyAvailabilityHours] = useState(1);
  const [strongestTools, setStrongestTools] = useState<string[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [draftMissing, setDraftMissing] = useState(false);
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const isSubmissionPage =
    state.status === "submitting" || state.status === "success";
  const answeredCount = aptitudeTest.filter((question) => answers[question.id])
    .length;
  const isComplete = answeredCount === aptitudeTest.length;

  function toggleTool(tool: string) {
    setStrongestTools((currentTools) =>
      currentTools.includes(tool)
        ? currentTools.filter((item) => item !== tool)
        : [...currentTools, tool],
    );
    setToolsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isComplete) {
      setState({
        status: "error",
        message: "Complete every aptitude question before submitting.",
      });
      return;
    }

    const draft = readStoredDraft(jobId);

    if (!draft) {
      setDraftMissing(true);
      setState({
        status: "error",
        message: "Return to the application form before taking the aptitude test.",
      });
      return;
    }

    setState({ status: "submitting", message: "Submitting application" });

    try {
      const response = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          startAvailabilityDays,
          expectedHourlyRateUsd,
          weeklyAvailabilityHours,
          strongestTools,
          aptitudeAnswers: aptitudeTest.map((question) => ({
            questionId: question.id,
            selectedOptionId: answers[question.id],
          })),
        }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: getErrorMessage(payload) });
        return;
      }

      sessionStorage.removeItem(applicationDraftStorageKey(jobId));

      const autoApproved =
        isApplicationPayload(payload) && payload.application.status === "CERTIFIED";
      const score = isApplicationPayload(payload)
        ? payload.application.aptitudeScorePercent
        : null;

      setState({
        status: "success",
        message: autoApproved
          ? `Your aptitude score was ${score}%, so your application was automatically approved and the task is now available on your home page.`
          : `Your aptitude score was ${score ?? "recorded"}%. Your application is pending manual review before the task unlocks.`,
      });
    } catch {
      setState({
        status: "error",
        message: "Unable to submit application",
      });
    }
  }

  if (isSubmissionPage) {
    return (
      <ApplicationSubmissionPage
        message={state.message}
        onClose={() => router.push("/home")}
        status={state.status}
      />
    );
  }

  if (draftMissing) {
    return (
      <section className="rounded-lg border border-[#ffd6d6] bg-brand-ivory p-5 text-brand-ink shadow-brand-card sm:p-6">
        <h1 className="text-[24px] font-semibold leading-tight text-brand-ink">
          Application details required
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-brand-muted">
          Complete the application form first, then continue to the aptitude
          test from there.
        </p>
        <button
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-ink px-5 text-[15px] font-semibold text-brand-ivory shadow-sm transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 sm:w-auto"
          onClick={() => router.push(applicationHref)}
          type="button"
        >
          Back to application
        </button>
      </section>
    );
  }

  return (
    <>
      {state.status === "error" && state.message ? (
        <ApplicationErrorDialog
          message={state.message}
          onClose={() => setState({ status: "idle", message: "" })}
        />
      ) : null}
      <form
        className="rounded-lg border border-brand-sand bg-brand-ivory p-5 text-brand-ink shadow-brand-card sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-4 border-b border-brand-sand pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#f2e8d7] text-brand-gold-strong">
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight text-brand-ink">
                Task aptitude test
              </h1>
              <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-brand-muted">
                Answer all 15 role-related questions. A minimum score of 12 out
                of 15 automatically approves you for this task.
              </p>
            </div>
          </div>
          <span className="inline-flex h-9 shrink-0 items-center rounded border border-brand-sand bg-brand-canvas px-3 text-[13px] font-semibold text-brand-gold-strong">
            {answeredCount}/{aptitudeTest.length}
          </span>
        </div>

        <section className="mt-5 rounded border border-brand-sand bg-brand-canvas/60 p-4">
          <h2 className="text-[18px] font-semibold leading-[1.35] text-brand-ink">
            Application questions
          </h2>

          <div className="mt-5 space-y-5">
            <NumberStepper
              label="Q1. How soon can you start the work? (in days)"
              max={365}
              min={0}
              name="startAvailabilityDays"
              onChange={setStartAvailabilityDays}
              value={startAvailabilityDays}
            />

            <div>
              <label
                className="text-[12px] font-medium text-brand-ink"
                htmlFor="expectedHourlyRateUsd"
              >
                Q2. What is your expected hourly rate in USD?
              </label>
              <div className="mt-2 flex h-10 overflow-hidden rounded border border-brand-sand bg-brand-ivory focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold">
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none"
                  id="expectedHourlyRateUsd"
                  min={1}
                  name="expectedHourlyRateUsd"
                  onChange={(event) =>
                    setExpectedHourlyRateUsd(
                      Math.max(1, Number(event.target.value)),
                    )
                  }
                  type="number"
                  value={expectedHourlyRateUsd}
                />
                <span className="flex items-center px-3 text-[13px] font-medium text-brand-ink">
                  /hour
                </span>
              </div>
            </div>

            <NumberStepper
              label="Q3. How many hours per week are you available to work?"
              max={168}
              min={1}
              name="weeklyAvailabilityHours"
              onChange={setWeeklyAvailabilityHours}
              value={weeklyAvailabilityHours}
            />

            <div className="relative">
              <p className="text-[12px] font-medium leading-[1.45] text-brand-ink">
                Q4. Which of the following tools do you have the strongest
                hands-on experience with?
              </p>
              <button
                className="mt-2 flex min-h-16 w-full items-center gap-2 rounded border border-brand-sand bg-brand-ivory px-3 py-2 text-left text-[12px] text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                onClick={() => setToolsOpen((isOpen) => !isOpen)}
                type="button"
              >
                <span className="flex flex-1 flex-wrap gap-x-4 gap-y-2">
                  {strongestTools.length ? (
                    strongestTools.map((tool) => (
                      <span className="inline-flex items-center gap-2" key={tool}>
                        {tool}
                        <span
                          aria-hidden="true"
                          className="text-[15px] font-semibold leading-none text-brand-ink"
                        >
                          x
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-brand-muted">Select options...</span>
                  )}
                </span>
                <X aria-hidden="true" className="h-4 w-4 text-brand-muted" />
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 text-brand-muted"
                />
              </button>
              {toolsOpen ? (
                <div className="absolute left-0 right-0 z-10 mt-1 grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded border border-brand-sand bg-brand-ivory p-2 shadow-brand-card">
                  {toolOptions.map((tool) => (
                    <button
                      className={
                        strongestTools.includes(tool)
                          ? "rounded bg-[#f2e8d7] px-2 py-1.5 text-left text-[12px] font-medium text-brand-gold-strong"
                          : "rounded px-2 py-1.5 text-left text-[12px] text-brand-muted hover:bg-brand-canvas"
                      }
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      type="button"
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-4">
          {aptitudeTest.map((question, index) => (
            <fieldset
              className="rounded border border-brand-sand bg-brand-canvas/60 p-4"
              key={question.id}
            >
              <legend className="text-[14px] font-semibold leading-[1.45] text-brand-ink">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => (
                  <label
                    className={
                      answers[question.id] === option.id
                        ? "flex cursor-pointer items-start gap-2 rounded border border-brand-gold bg-[#f2e8d7] px-3 py-2 text-[13px] text-brand-ink"
                        : "flex cursor-pointer items-start gap-2 rounded border border-brand-sand bg-brand-ivory px-3 py-2 text-[13px] text-brand-muted transition hover:border-brand-gold"
                    }
                    key={option.id}
                  >
                    <input
                      checked={answers[question.id] === option.id}
                      className="mt-1 accent-brand-gold"
                      name={`aptitude-${question.id}`}
                      onChange={() =>
                        setAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [question.id]: option.id,
                        }))
                      }
                      required
                      type="radio"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-brand-sand bg-brand-canvas px-5 text-[15px] font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7] focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
            onClick={() => router.push(applicationHref)}
            type="button"
          >
            Back
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand-ink px-5 text-[15px] font-semibold text-brand-ivory shadow-sm transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-65"
            disabled={!isComplete}
            type="submit"
          >
            Submit application
          </button>
        </div>
      </form>
    </>
  );
}
