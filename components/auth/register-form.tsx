"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type RegisterState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type RegisterFormProps = {
  callbackUrl?: string;
};

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Unable to create account";
}

function verificationEmailWasSent(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "verificationEmailSent" in payload &&
      payload.verificationEmailSent === true,
  );
}

export function RegisterForm({ callbackUrl = "/home" }: RegisterFormProps) {
  const [state, setState] = useState<RegisterState>({
    status: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Creating account" });

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(payload) });
      return;
    }

    if (!verificationEmailWasSent(payload)) {
      setState({
        status: "error",
        message:
          "Your account was created, but the verification email could not be sent. Contact support before creating another account.",
      });
      return;
    }

    setState({
      status: "success",
      message:
        "We sent a verification link to your email. Verify your address before signing in.",
    });
  }

  if (state.status === "success") {
    return (
      <div aria-live="polite" className="space-y-5" role="status">
        <div className="rounded-[12px] border border-brand-gold/50 bg-[var(--color-accent-soft)] p-5">
          <h2 className="text-lg font-semibold text-brand-ink">
            Check your email
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-gold-strong">
            {state.message}
          </p>
        </div>
        <p className="text-sm text-brand-muted">
          After verification, return to{" "}
          <Link
            className="font-semibold text-brand-gold-strong underline-offset-4 hover:text-brand-ink hover:underline"
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="name">
          Name
        </label>
        <input
          autoComplete="name"
          className="mt-2 h-12 w-full rounded-[10px] border border-brand-sand bg-brand-canvas/35 px-3.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/15"
          id="name"
          minLength={2}
          name="name"
          placeholder="Your full name"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-[10px] border border-brand-sand bg-brand-canvas/35 px-3.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/15"
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </div>
      <div>
        <label
          className="text-sm font-medium text-brand-ink"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 h-12 w-full rounded-[10px] border border-brand-sand bg-brand-canvas/35 px-3.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/15"
          id="password"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
      </div>
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-brand-ink px-5 text-sm font-semibold text-brand-ivory transition hover:bg-[var(--color-action-hover)] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-brand-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={state.status === "submitting"}
        type="submit"
      >
        {state.status === "submitting" ? "Creating account" : "Create account"}
      </button>
      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium leading-5 text-red-800"
              : "text-sm font-medium text-brand-gold-strong"
          }
        >
          {state.message}
        </p>
      ) : null}
      <p className="text-sm text-brand-muted">
        Have an account?{" "}
        <Link
          className="font-semibold text-brand-gold-strong underline-offset-4 hover:text-brand-ink hover:underline"
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
