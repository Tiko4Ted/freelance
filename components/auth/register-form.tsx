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

export function RegisterForm({ callbackUrl = "/dashboard" }: RegisterFormProps) {
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
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Name
        </label>
        <input
          className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-teal-700"
          id="name"
          minLength={2}
          name="name"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-teal-700"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <input
          className="mt-2 h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-teal-700"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>
      <button
        className="inline-flex h-11 w-full items-center justify-center border border-slate-950 bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
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
              : "text-sm font-medium text-teal-700"
          }
        >
          {state.message}
        </p>
      ) : null}
      <p className="text-sm text-slate-600">
        Have an account?{" "}
        <Link
          className="font-medium text-teal-700"
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
