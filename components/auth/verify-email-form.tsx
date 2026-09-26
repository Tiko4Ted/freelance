"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VerificationState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "error"; message: string };

type VerifyEmailFormProps = {
  token: string | null;
};

function responseError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Unable to verify this email address";
}

export function VerifyEmailForm({ token }: VerifyEmailFormProps) {
  const [state, setState] = useState<VerificationState>({
    status: token ? "idle" : "error",
    message: token ? "" : "This verification link is incomplete.",
  });

  useEffect(() => {
    if (!token || !window.location.search) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
  }, [token]);

  async function verifyEmail() {
    if (!token || state.status === "submitting") {
      return;
    }

    setState({ status: "submitting", message: "Verifying your email" });

    try {
      const response = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        setState({ status: "error", message: responseError(payload) });
        return;
      }

      window.location.replace("/login?verified=1");
    } catch {
      setState({
        status: "error",
        message: "Unable to reach the verification service. Try again.",
      });
    }
  }

  return (
    <div className="space-y-5 text-center">
      <p
        aria-live="polite"
        className={
          state.status === "error"
            ? "text-sm font-medium leading-6 text-red-700"
            : "text-sm font-medium leading-6 text-brand-muted"
        }
      >
        {state.message || "Confirm this email address to complete verification."}
      </p>
      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-ink px-5 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!token || state.status === "submitting"}
        onClick={verifyEmail}
        type="button"
      >
        Verify email
      </button>
      <Link
        className="inline-block text-sm font-medium text-brand-gold-strong hover:text-brand-ink hover:underline"
        href="/login"
      >
        Return to sign in
      </Link>
    </div>
  );
}
