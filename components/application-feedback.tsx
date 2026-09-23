"use client";

import { AlertCircle, CheckCircle2, FileText, LoaderCircle } from "lucide-react";

export type SubmitState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function getErrorMessage(payload: unknown) {
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

export function isApplicationPayload(
  payload: unknown,
): payload is { application: { status: string; aptitudeScorePercent: number } } {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "application" in payload &&
    payload.application !== null &&
    typeof payload.application === "object" &&
    "status" in payload.application &&
    typeof payload.application.status === "string" &&
    "aptitudeScorePercent" in payload.application &&
    typeof payload.application.aptitudeScorePercent === "number"
  );
}

export function ApplicationSubmissionPage({
  status,
  message,
  onClose,
}: {
  status: Extract<SubmitState["status"], "submitting" | "success">;
  message: string;
  onClose: () => void;
}) {
  const isSuccess = status === "success";

  return (
    <section className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-brand-canvas px-5 py-8 text-brand-ink sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[760px] flex-col justify-center py-8">
        <div className="rounded-lg border border-brand-sand bg-brand-ivory px-5 py-7 shadow-brand-card sm:px-8 sm:py-9">
          <div className="flex items-center gap-3">
            <span
              className={
                isSuccess
                  ? "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#e8f8f3] text-[#087c66]"
                  : "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#f2e8d7] text-brand-gold-strong"
              }
            >
              {isSuccess ? (
                <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
              ) : (
                <FileText aria-hidden="true" className="h-6 w-6" />
              )}
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                Application documents
              </p>
              <h1 className="mt-1 text-[24px] font-semibold leading-tight text-brand-ink sm:text-[30px]">
                {isSuccess ? "Submission received" : "Preparing your submission"}
              </h1>
            </div>
          </div>

          {isSuccess ? (
            <div className="mt-8 space-y-4 text-[15px] leading-[1.65] text-brand-muted">
              <p>{message}</p>
              <p>
                Your application details, availability, resume information, and
                role-specific aptitude result have been saved against this
                opening.
              </p>
              <p>
                Open your home page to see whether the task is already available
                or whether the application is waiting for manual review.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <div className="flex items-center gap-3 rounded-md border border-brand-sand bg-brand-canvas px-4 py-4">
                <LoaderCircle
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin text-brand-gold-strong"
                />
                <p className="text-[14px] font-medium text-brand-ink">
                  {message}. Please keep this page open while we securely submit
                  your application documents.
                </p>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-brand-sand">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-gold" />
              </div>
            </div>
          )}

          {isSuccess ? (
            <button
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-ink px-5 text-[15px] font-semibold text-brand-ivory shadow-sm transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 sm:w-auto"
              onClick={onClose}
              type="button"
            >
              Go to home
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ApplicationErrorDialog({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      aria-labelledby="application-error-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/70 px-5 py-8"
      role="dialog"
    >
      <div className="w-full max-w-[430px] rounded-lg border border-[#ffd6d6] bg-brand-ivory p-5 text-brand-ink shadow-[0_24px_80px_rgba(38,41,31,0.2)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#fff0f0] text-red-700">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              className="text-[18px] font-semibold leading-tight text-brand-ink"
              id="application-error-title"
            >
              Application not submitted
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-brand-muted">
              {message}
            </p>
          </div>
        </div>
        <button
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-brand-ink px-4 text-[14px] font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
          onClick={onClose}
          type="button"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
