"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type LoginState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "error"; message: string };

type LoginFormProps = {
  callbackUrl?: string;
  emailVerified?: boolean;
};

export function LoginForm({
  callbackUrl = "/home",
  emailVerified = false,
}: LoginFormProps) {
  const [state, setState] = useState<LoginState>({
    status: "idle",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Signing in" });

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setState({
        status: "error",
        message: "Invalid credentials or email address not verified",
      });
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {emailVerified ? (
        <div
          aria-live="polite"
          className="rounded-[12px] border border-brand-gold/50 bg-[var(--color-accent-soft)] p-4 text-sm font-medium leading-6 text-brand-gold-strong"
          role="status"
        >
          Email verified. Sign in to continue.
        </div>
      ) : null}
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
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-[10px] border border-brand-sand bg-brand-canvas/35 px-3.5 text-sm text-brand-ink outline-none transition placeholder:text-brand-muted/70 focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/15"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>
      <button
        className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-brand-ink px-5 text-sm font-semibold text-brand-ivory transition hover:bg-[var(--color-action-hover)] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-brand-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={state.status === "submitting"}
        type="submit"
      >
        {state.status === "submitting" ? "Signing in" : "Sign in"}
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
        No account?{" "}
        <Link
          className="font-semibold text-brand-gold-strong underline-offset-4 hover:text-brand-ink hover:underline"
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
