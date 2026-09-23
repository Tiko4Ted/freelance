"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type RegisterState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-brand-ink" htmlFor="name">
          Name
        </label>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          id="name"
          minLength={2}
          name="name"
          required
        />
      </div>
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
        Create account
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
        Have an account?{" "}
        <Link
          className="font-medium text-brand-gold-strong hover:text-brand-ink hover:underline"
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
