"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

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
const FREELANCE_ID_GENERATOR_URL = "https://id-generator-mu.vercel.app/";

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
  const [isOpen, setIsOpen] = useState(false);
  const transferTriggerRef = useRef<HTMLButtonElement>(null);
  const actionsWereOpen = useRef(false);

  useEffect(() => {
    if (isOpen) {
      actionsWereOpen.current = true;
      return;
    }

    if (actionsWereOpen.current) {
      transferTriggerRef.current?.focus();
      actionsWereOpen.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && !showVerification) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (showVerification) {
        setShowVerification(false);
      } else {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, showVerification]);

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
    setState({
      status: "success",
      message: "Transfer submitted for admin approval",
    });
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

    setState({ status: "submitting", message: "Submitting transfer for review" });
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
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-sand/80 bg-brand-canvas/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-ink">Transfer funds</p>
            <p className="mt-1 text-xs leading-5 text-brand-muted">
              Move funds from Spot to Funding.
            </p>
          </div>
          <button
            aria-controls="wallet-actions"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-brand-ink px-3 text-xs font-semibold text-brand-ivory transition hover:bg-[#35392c] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            onClick={() => setIsOpen(true)}
            ref={transferTriggerRef}
            type="button"
          >
            Transfer funds
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          aria-labelledby="wallet-actions-title"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end justify-center bg-brand-ink/55 p-4 sm:items-center"
          id="wallet-actions"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          role="dialog"
        >
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-brand-sand bg-brand-ivory shadow-2xl">
            <div className="sticky top-0 z-[1] flex items-start justify-between gap-4 border-b border-brand-sand bg-brand-ivory px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">
                  Wallet actions
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-brand-ink" id="wallet-actions-title">
                  Transfer or request a payout
                </h2>
              </div>
              <button
                aria-label="Close wallet actions"
                className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-canvas hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <form
                aria-busy={state.status === "submitting"}
                className="space-y-2"
                onSubmit={requestTransfer}
              >
                <div>
                  <h3 className="text-sm font-semibold text-brand-ink">
                    Transfer from Spot wallet
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">
                    Move approved funds into Funding after verification.
                  </p>
                </div>
                <div>
                  <label
                    className="text-sm font-medium text-brand-ink"
                    htmlFor="transferAmountDollars"
                  >
                    Transfer amount
                  </label>
                  <input
                    className="mt-1 h-9 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:cursor-not-allowed disabled:bg-brand-sand/50"
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
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-brand-sand bg-brand-ivory px-4 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[var(--color-accent-soft)] hover:text-brand-gold-strong disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={state.status === "submitting"}
                  type="submit"
                >
                  {state.status === "submitting" ? "Checking wallet..." : "Move to Funding"}
                </button>
              </form>

              <form
                aria-busy={state.status === "submitting"}
                className="space-y-2 border-t border-brand-sand/70 pt-5"
                onSubmit={requestWithdrawal}
              >
                <div>
                  <h3 className="text-sm font-semibold text-brand-ink">
                    Request a payout
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">
                    Use Funding once it reaches the $10 minimum.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink" htmlFor="amountDollars">
                    Payout amount
                  </label>
                  <input
                    className="mt-1 h-9 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:cursor-not-allowed disabled:bg-brand-sand/50"
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
                <label className="text-sm font-medium text-brand-ink" htmlFor="payoutMethod">
                  Payout method
                </label>
                <select
                  className="h-9 w-full rounded-lg border border-brand-sand bg-brand-ivory px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                  id="payoutMethod"
                  name="payoutMethod"
                  onChange={(event) => setPayoutMethod(event.target.value as PayoutMethod)}
                  value={payoutMethod}
                >
                  {payoutMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <label className="text-sm font-medium text-brand-ink" htmlFor="destinationDetails">
                  Payout destination
                </label>
                <input
                  className="h-9 w-full rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold disabled:cursor-not-allowed disabled:bg-brand-sand/50"
                  disabled={fundingBalanceCents < 1000 || state.status === "submitting"}
                  id="destinationDetails"
                  name="destinationDetails"
                  placeholder={destinationPlaceholders[payoutMethod]}
                  required
                />
                <button
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-brand-ink px-4 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={fundingBalanceCents < 1000 || state.status === "submitting"}
                  type="submit"
                >
                  Request payout
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm font-medium text-red-700"
              : "text-sm font-medium text-emerald-700"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      {showVerification ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/70 px-4">
          <div
            aria-labelledby="complete-transfer-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-brand-sand bg-brand-ivory p-5 shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-ink" id="complete-transfer-title">
                  Complete transfer
                </h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Enter your Freelance ID and serial number to complete this
                  transfer from Spot to Funding.
                </p>
                <div className="mt-3 rounded-lg border border-brand-gold/30 bg-[var(--color-accent-soft)] p-3">
                  <p className="text-xs leading-5 text-brand-muted">
                    Do not have a Freelance ID yet?
                  </p>
                  <a
                    className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-brand-sand bg-brand-ivory px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-gold hover:text-brand-gold-strong focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                    href={FREELANCE_ID_GENERATOR_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open ID generator
                  </a>
                </div>
              </div>
              <button
                aria-label="Close verification dialog"
                className="rounded-md px-1 text-xl leading-none text-brand-muted transition hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
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
