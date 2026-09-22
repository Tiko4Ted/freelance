"use client";

import { FormEvent, useState } from "react";

type FormState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type PayoutMethod =
  | "MPESA"
  | "AIRTEL_MONEY"
  | "BANK_CARD"
  | "BINANCE"
  | "PAYPAL";

const payoutMethods: Array<{ value: PayoutMethod; label: string }> = [
  { value: "MPESA", label: "M-Pesa" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "BANK_CARD", label: "Bank card" },
  { value: "BINANCE", label: "Binance" },
  { value: "PAYPAL", label: "PayPal" },
];

const destinationPlaceholders: Record<PayoutMethod, string> = {
  MPESA: "M-Pesa phone number",
  AIRTEL_MONEY: "Airtel Money phone number",
  BANK_CARD: "Card or bank account label",
  BINANCE: "Binance email or account ID",
  PAYPAL: "PayPal email",
};

const MIN_TRANSFER_CENTS = 1000;
const MIN_TRANSFER_DOLLARS = MIN_TRANSFER_CENTS / 100;

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

type WithdrawalFormProps = {
  holdingBalanceCents: number;
  fundingBalanceCents: number;
  isFreelanceVerified: boolean;
};

export function WithdrawalForm({
  holdingBalanceCents,
  fundingBalanceCents,
  isFreelanceVerified,
}: WithdrawalFormProps) {
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
  });
  const [showVerification, setShowVerification] = useState(false);
  const [pendingTransferAmount, setPendingTransferAmount] = useState(0);
  const [verified, setVerified] = useState(isFreelanceVerified);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("MPESA");

  async function postTransfer(payload: Record<string, unknown>) {
    let response: Response;
    let responsePayload: unknown;

    try {
      response = await fetch("/api/v1/wallet/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      responsePayload = await response.json();
    } catch {
      setState({
        status: "error",
        message: "Transfer failed",
      });
      return false;
    }

    if (!response.ok) {
      if (response.status === 428) {
        setShowVerification(true);
      }

      setState({
        status: "error",
        message: getErrorMessage(responsePayload, "Transfer failed"),
      });
      return false;
    }

    setVerified(true);
    setState({ status: "success", message: "Funds moved to Funding" });
    window.location.reload();
    return true;
  }

  async function requestTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amountDollars = Number(formData.get("transferAmountDollars") ?? 0);
    const amountCents = Math.round(amountDollars * 100);

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setState({
        status: "error",
        message: "Enter a transfer amount.",
      });
      return;
    }

    if (amountCents < MIN_TRANSFER_CENTS) {
      setState({
        status: "error",
        message: `Minimum transfer amount is $${MIN_TRANSFER_DOLLARS}.`,
      });
      return;
    }

    if (amountCents > holdingBalanceCents) {
      setState({
        status: "error",
        message: "Transfer amount cannot exceed your available balance.",
      });
      return;
    }

    setPendingTransferAmount(amountCents);

    if (!verified) {
      setState({ status: "submitting", message: "Checking transfer amount" });
      window.setTimeout(() => {
        setState({ status: "idle", message: "" });
        setShowVerification(true);
      }, 650);
      return;
    }

    setState({ status: "submitting", message: "Moving funds to Funding" });
    await postTransfer({ amountCents });
  }

  async function verifyAndTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({ status: "submitting", message: "Completing transfer" });

    const success = await postTransfer({
      amountCents: pendingTransferAmount,
      freelanceIdCode: String(formData.get("freelanceIdCode") ?? ""),
      serialNumber: String(formData.get("serialNumber") ?? ""),
    });

    if (success) {
      setShowVerification(false);
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
      body: JSON.stringify({
        amountCents: Math.round(amountDollars * 100),
        payoutMethod,
        destinationDetails: String(formData.get("destinationDetails") ?? ""),
      }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({
        status: "error",
        message: getErrorMessage(payload, "Withdrawal failed"),
      });
      return;
    }

    event.currentTarget.reset();
    setState({ status: "success", message: "Withdrawal requested" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <form className="space-y-3" onSubmit={requestTransfer}>
        <div>
          <label
            className="text-sm font-medium text-brand-ink"
            htmlFor="transferAmountDollars"
          >
            Transfer amount
          </label>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:cursor-not-allowed disabled:bg-brand-sand/50"
            disabled={state.status === "submitting"}
            id="transferAmountDollars"
            min={1}
            name="transferAmountDollars"
            placeholder={`Amount, min $${MIN_TRANSFER_DOLLARS}`}
            required
            step="1"
            type="number"
          />
        </div>
        <button
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-brand-sand bg-brand-ivory px-4 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7] hover:text-brand-gold-strong disabled:cursor-not-allowed disabled:opacity-50"
          disabled={state.status === "submitting"}
          type="submit"
        >
          {state.status === "submitting" ? "Loading..." : "Transfer"}
        </button>
      </form>

      <form className="space-y-3" onSubmit={requestWithdrawal}>
        <div>
          <label className="text-sm font-medium text-brand-ink" htmlFor="amountDollars">
            Withdraw from Funding
          </label>
          <input
            className="mt-2 h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:cursor-not-allowed disabled:bg-brand-sand/50"
            disabled={fundingBalanceCents < 1000 || state.status === "submitting"}
            id="amountDollars"
            max={Math.floor(fundingBalanceCents / 100)}
            min={10}
            name="amountDollars"
            placeholder="Amount (min $10)"
            required
            step="1"
            type="number"
          />
        </div>
        <select
          className="h-10 w-full rounded-lg border border-brand-sand bg-brand-ivory px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          onChange={(event) => setPayoutMethod(event.target.value as PayoutMethod)}
          value={payoutMethod}
        >
          {payoutMethods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
        <input
          className="h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:cursor-not-allowed disabled:bg-brand-sand/50"
          disabled={fundingBalanceCents < 1000 || state.status === "submitting"}
          name="destinationDetails"
          placeholder={destinationPlaceholders[payoutMethod]}
          required
        />
        <button
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={fundingBalanceCents < 1000 || state.status === "submitting"}
          type="submit"
        >
          Request withdrawal
        </button>
      </form>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm font-medium text-red-700"
              : "text-sm font-medium text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      {showVerification ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-brand-sand bg-brand-ivory p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-ink">
                  Complete transfer
                </h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Enter your Freelance ID and serial number to complete this
                  transfer from Holding to Funding.
                </p>
              </div>
              <button
                className="text-xl leading-none text-brand-muted transition hover:text-brand-ink"
                onClick={() => setShowVerification(false)}
                type="button"
              >
                x
              </button>
            </div>
            <form className="mt-5 space-y-3" onSubmit={verifyAndTransfer}>
              <input
                className="h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                name="freelanceIdCode"
                placeholder="Freelance ID"
                required
              />
              <input
                className="h-10 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                name="serialNumber"
                placeholder="Serial number"
                required
              />
              <button
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={state.status === "submitting"}
                type="submit"
              >
                {state.status === "submitting"
                  ? "Loading..."
                  : "Complete transfer"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
