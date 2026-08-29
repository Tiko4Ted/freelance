"use client";

import { FormEvent, useState } from "react";
import { ClipboardCheck } from "lucide-react";
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
          ? `Your aptitude score was ${score}%, so your application was automatically approved and the task is now available in your dashboard.`
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
        onClose={() => router.push("/dashboard")}
        status={state.status}
      />
    );
  }

  if (draftMissing) {
    return (
      <section className="rounded-lg border border-[#ffd6d6] bg-white p-5 text-[#151625] shadow-sm sm:p-6">
        <h1 className="text-[24px] font-semibold leading-tight text-[#10121f]">
          Application details required
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-[#3b3f51]">
          Complete the application form first, then continue to the aptitude
          test from there.
        </p>
        <button
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1723a7] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#101a91] sm:w-auto"
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
        className="rounded-lg bg-[#f2f1fb] p-5 text-[#151625] sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-4 border-b border-[#d7d7e6] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white text-[#2738d9]">
              <ClipboardCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight text-[#10121f]">
                Task aptitude test
              </h1>
              <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-[#4d5060]">
                Answer all 15 role-related questions. A score above 40%
                automatically approves you for this task.
              </p>
            </div>
          </div>
          <span className="inline-flex h-9 shrink-0 items-center rounded border border-[#cfd1df] bg-white px-3 text-[13px] font-semibold text-[#242634]">
            {answeredCount}/{aptitudeTest.length}
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          {aptitudeTest.map((question, index) => (
            <fieldset
              className="rounded border border-[#d0d0dc] bg-white p-4"
              key={question.id}
            >
              <legend className="text-[14px] font-semibold leading-[1.45] text-[#242634]">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-3 grid gap-2">
                {question.options.map((option) => (
                  <label
                    className={
                      answers[question.id] === option.id
                        ? "flex cursor-pointer items-start gap-2 rounded border border-[#3142ff] bg-[#eef0ff] px-3 py-2 text-[13px] text-[#151625]"
                        : "flex cursor-pointer items-start gap-2 rounded border border-[#e0e0ea] px-3 py-2 text-[13px] text-[#343643] transition hover:border-[#9da4ff]"
                    }
                    key={option.id}
                  >
                    <input
                      checked={answers[question.id] === option.id}
                      className="mt-1"
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
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#e2e6ff] px-5 text-[15px] font-semibold text-[#252735] transition hover:bg-[#d9defd]"
            onClick={() => router.push(applicationHref)}
            type="button"
          >
            Back
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-[#3e52ff] to-[#1723a7] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:from-[#3345f0] hover:to-[#101a91] disabled:cursor-not-allowed disabled:opacity-65"
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
