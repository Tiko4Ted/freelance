"use client";

import { FormEvent, useState } from "react";

type FormState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Withdrawal failed";
}

type WithdrawalFormProps = {
  payoutAccountReady: boolean;
};

export function WithdrawalForm({ payoutAccountReady }: WithdrawalFormProps) {
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
  });
  const [accountReady, setAccountReady] = useState(payoutAccountReady);

  async function setupPayoutAccount() {
    setState({ status: "submitting", message: "Setting up payout account" });
    const response = await fetch("/api/v1/wallet/payout-account", {
      method: "POST",
    });

    if (response.ok) {
      setAccountReady(true);
      setState({ status: "success", message: "Payout account ready" });
    } else {
      setState({ status: "error", message: "Payout setup failed" });
    }
  }

  async function requestWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Requesting withdrawal" });

    const formData = new FormData(event.currentTarget);
    const amountDollars = Number(formData.get("amountDollars") ?? 0);
    const response = await fetch("/api/v1/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: Math.round(amountDollars * 100) }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(payload) });
      return;
    }

    event.currentTarget.reset();
    setState({ status: "success", message: "Withdrawal requested" });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <button
        className="inline-flex h-10 w-full items-center justify-center border border-slate-950 px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        disabled={accountReady || state.status === "submitting"}
        onClick={setupPayoutAccount}
        type="button"
      >
        {accountReady ? "Payout account ready ✓" : "Set up payout account"}
      </button>
      <form className="space-y-3" onSubmit={requestWithdrawal}>
        <input
          className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={!accountReady}
          min={10}
          name="amountDollars"
          placeholder="Amount (min $10)"
          required
          step="1"
          type="number"
        />
        <button
          className="inline-flex h-10 w-full items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!accountReady || state.status === "submitting"}
          type="submit"
        >
          Request withdrawal
        </button>
        {!accountReady ? (
          <p className="text-xs text-slate-500">
            Set up your payout account before requesting a withdrawal.
          </p>
        ) : null}
      </form>
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
    </div>
  );
}
