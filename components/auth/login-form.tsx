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
          className="rounded-xl border border-brand-gold bg-[#f2e8d7] p-4 text-sm font-medium leading-6 text-brand-gold-strong"
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
          className="mt-2 h-11 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          id="email"
          name="email"
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
          className="mt-2 h-11 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>
      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-ink px-5 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={state.status === "submitting"}
        type="submit"
      >
        Sign in
      </button>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm font-medium text-red-700"
              : "text-sm font-medium text-brand-gold-strong"
          }
        >
          {state.message}
        </p>
      ) : null}
      <p className="text-sm text-brand-muted">
        No account?{" "}
        <Link
          className="font-medium text-brand-gold-strong hover:text-brand-ink hover:underline"
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
