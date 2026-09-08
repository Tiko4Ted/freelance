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
  outcome = "pending",
  onClose,
}: {
  status: Extract<SubmitState["status"], "submitting" | "success">;
  message: string;
  outcome?: "approved" | "pending" | "rejected";
  onClose: () => void;
}) {
  const isSuccess = status === "success";
  const isRejected = isSuccess && outcome === "rejected";

  return (
    <section className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-[#f8f8ff] px-5 py-8 text-[#151625] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[760px] flex-col justify-center py-8">
        <div className="rounded-lg border border-[#dfe2f4] bg-white px-5 py-7 shadow-[0_24px_80px_rgba(28,34,76,0.12)] sm:px-8 sm:py-9">
          <div className="flex items-center gap-3">
            <span
              className={
                isRejected
                  ? "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#fff0f0] text-red-700"
                  : isSuccess
                  ? "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#e8f8f3] text-[#087c66]"
                  : "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#eef0ff] text-[#2d3fe5]"
              }
            >
              {isRejected ? (
                <AlertCircle aria-hidden="true" className="h-6 w-6" />
              ) : isSuccess ? (
                <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
              ) : (
                <FileText aria-hidden="true" className="h-6 w-6" />
              )}
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#60677c]">
                Application documents
              </p>
              <h1 className="mt-1 text-[24px] font-semibold leading-tight text-[#10121f] sm:text-[30px]">
                {isRejected
                  ? "Application rejected"
                  : isSuccess
                    ? "Submission received"
                    : "Preparing your submission"}
              </h1>
            </div>
          </div>

          {isSuccess ? (
            <div className="mt-8 space-y-4 text-[15px] leading-[1.65] text-[#343849]">
              <p>{message}</p>
              <p>
                Your application details, availability, resume information, and
                role-specific aptitude result have been saved against this
                opening.
              </p>
              {isRejected ? (
                <p>This role will appear as rejected in your dashboard.</p>
              ) : (
                <p>
                  Open your dashboard to see whether the task is already
                  available or whether the application is waiting for manual
                  review.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-8">
              <div className="flex items-center gap-3 rounded-md border border-[#dfe2f4] bg-[#fbfbff] px-4 py-4">
                <LoaderCircle
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin text-[#3142ff]"
                />
                <p className="text-[14px] font-medium text-[#2c3041]">
                  {message}. Please keep this page open while we securely submit
                  your application documents.
                </p>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e4e7f7]">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-[#3142ff]" />
              </div>
            </div>
          )}

          {isSuccess ? (
            <button
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#1723a7] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#101a91] sm:w-auto"
              onClick={onClose}
              type="button"
            >
              Go to dashboard
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#11131f]/60 px-5 py-8"
      role="dialog"
    >
      <div className="w-full max-w-[430px] rounded-lg border border-[#ffd6d6] bg-white p-5 text-[#151625] shadow-[0_24px_80px_rgba(18,22,44,0.24)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#fff0f0] text-red-700">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              className="text-[18px] font-semibold leading-tight text-[#10121f]"
              id="application-error-title"
            >
              Application not submitted
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-[#3b3f51]">
              {message}
            </p>
          </div>
        </div>
        <button
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#1723a7] px-4 text-[14px] font-semibold text-white transition hover:bg-[#101a91]"
          onClick={onClose}
          type="button"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
