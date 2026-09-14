"use client";

import { type FormEvent, useState } from "react";
import {
  CreditCard,
  FileText,
  Lock,
  Phone,
  Shield,
  CheckCircle2,
  X,
  Check,
  UserCheck,
} from "lucide-react";

type OnboardingStatus = {
  ndaSignedAt: string | null;
  dataSubmissionSignedAt: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneVerifiedAt: string | null;
  identityLegalName: string | null;
  identityDateOfBirth: string | null;
  identityDocumentType: string | null;
  identityDocumentLast4: string | null;
  identityVerifiedAt: string | null;
  paymentMethod: string | null;
  paymentDestination: string | null;
  paymentSetupAt: string | null;
  payoutAccountReady: boolean;
  completedAt: string | null;
  legalComplete: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  paymentsSetup: boolean;
  complete: boolean;
};

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

interface OnboardingFlowClientProps {
  initialOnboarding: OnboardingStatus;
  isAuthenticated: boolean;
  userName?: string;
}

const payoutMethods: Array<{ value: PayoutMethod; label: string }> = [
  { value: "MPESA", label: "M-Pesa" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "BANK_CARD", label: "Bank card" },
  { value: "BINANCE", label: "Binance" },
  { value: "PAYPAL", label: "PayPal" },
];

const paymentPlaceholders: Record<PayoutMethod, string> = {
  MPESA: "M-Pesa phone number",
  AIRTEL_MONEY: "Airtel Money phone number",
  BANK_CARD: "Bank account or card label",
  BINANCE: "Binance email or account ID",
  PAYPAL: "PayPal email",
};

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

export function OnboardingFlowClient({
  initialOnboarding,
  isAuthenticated,
  userName = "Teddy",
}: OnboardingFlowClientProps) {
  const [onboarding, setOnboarding] =
    useState<OnboardingStatus>(initialOnboarding);
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
  });
  const [activeModal, setActiveModal] = useState<"nda" | "dataSubmission" | null>(
    null,
  );
  const [signerName, setSignerName] = useState(userName);
  const [signerTitle, setSignerTitle] = useState("Contractor");
  const [agreed, setAgreed] = useState(false);
  const [signatureText, setSignatureText] = useState(userName);
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    onboarding.phoneCountryCode ?? "+1",
  );
  const [phoneNumber, setPhoneNumber] = useState(onboarding.phoneNumber ?? "");
  const [verificationCode, setVerificationCode] = useState("123456");
  const [identityLegalName, setIdentityLegalName] = useState(
    onboarding.identityLegalName ?? userName,
  );
  const [identityDateOfBirth, setIdentityDateOfBirth] = useState(
    onboarding.identityDateOfBirth ?? "",
  );
  const [identityDocumentType, setIdentityDocumentType] = useState(
    onboarding.identityDocumentType ?? "national_id",
  );
  const [identityDocumentLast4, setIdentityDocumentLast4] = useState(
    onboarding.identityDocumentLast4 ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState<PayoutMethod>(
    (onboarding.paymentMethod as PayoutMethod | null) ?? "MPESA",
  );
  const [paymentDestination, setPaymentDestination] = useState(
    onboarding.paymentDestination ?? "",
  );

  const ndaSigned = Boolean(onboarding.ndaSignedAt);
  const dataSubmissionSigned = Boolean(onboarding.dataSubmissionSignedAt);

  const openSignModal = (doc: "nda" | "dataSubmission") => {
    setSignerName(userName);
    setSignerTitle(doc === "nda" ? "Contractor" : "User / Contributor");
    setSignatureText(userName);
    setAgreed(false);
    setActiveModal(doc);
  };

  const saveOnboardingAction = async (
    payload: Record<string, unknown>,
    successMessage: string,
  ) => {
    if (!isAuthenticated) {
      setState({
        status: "error",
        message: "Sign in before saving onboarding progress.",
      });
      return false;
    }

    setState({ status: "submitting", message: "Saving onboarding progress" });

    let response: Response;
    let responsePayload: unknown;

    try {
      response = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      responsePayload = await response.json();
    } catch {
      setState({ status: "error", message: "Unable to save onboarding" });
      return false;
    }

    if (!response.ok) {
      setState({
        status: "error",
        message: getErrorMessage(responsePayload, "Unable to save onboarding"),
      });
      return false;
    }

    if (
      responsePayload &&
      typeof responsePayload === "object" &&
      "onboarding" in responsePayload
    ) {
      setOnboarding(responsePayload.onboarding as OnboardingStatus);
    }

    setState({ status: "success", message: successMessage });
    return true;
  };

  const handleSignConfirm = async () => {
    if (!agreed || !signerName.trim() || !signatureText.trim()) return;
    if (!activeModal) return;

    const saved = await saveOnboardingAction(
      {
        action: "signLegal",
        document: activeModal,
        signerName,
        signerTitle,
        signatureText,
      },
      "Legal signature saved",
    );

    if (saved) {
      setActiveModal(null);
    }
  };

  const handlePhoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveOnboardingAction(
      {
        action: "verifyPhone",
        phoneCountryCode,
        phoneNumber,
        verificationCode,
      },
      "Phone verification saved",
    );
  };

  const handleIdentitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveOnboardingAction(
      {
        action: "verifyIdentity",
        legalName: identityLegalName,
        dateOfBirth: identityDateOfBirth,
        documentType: identityDocumentType,
        documentLast4: identityDocumentLast4,
      },
      "Identity verification saved",
    );
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveOnboardingAction(
      {
        action: "setupPayments",
        paymentMethod,
        paymentDestination,
      },
      "Payment setup saved",
    );
  };

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const saving = state.status === "submitting";
  const steps = [
    {
      label: "Sign Legal",
      complete: onboarding.legalComplete,
      locked: false,
      icon: FileText,
    },
    {
      label: "Verify Phone",
      complete: onboarding.phoneVerified,
      locked: !onboarding.legalComplete,
      icon: Phone,
    },
    {
      label: "Verify Identity",
      complete: onboarding.identityVerified,
      locked: !onboarding.phoneVerified,
      icon: UserCheck,
    },
    {
      label: "Set up Payments",
      complete: onboarding.paymentsSetup,
      locked: !onboarding.identityVerified,
      icon: CreditCard,
    },
  ];

  return (
    <div className="mx-auto max-w-[680px] pt-2">
      {/* Title & Subtitle */}
      <div className="text-center">
        <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
          Welcome, {userName}!
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Complete the steps below to get started with AfterQuery.
        </p>
      </div>

      {/* Main Stepper Card */}
      <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Stepper Header */}
        <div className="border-b border-slate-100 px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const active = !step.complete && !step.locked;

              return (
                <div className="contents" key={step.label}>
                  {index > 0 ? (
                    <div
                      className={`mx-2 -mt-5 h-[1px] flex-1 ${
                        steps[index - 1].complete
                          ? "bg-emerald-200"
                          : "bg-slate-200"
                      }`}
                    />
                  ) : null}
                  <div className="flex min-w-[72px] flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                        step.complete
                          ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                          : active
                            ? "border-[#0066cc] bg-[#eff6ff] text-[#0066cc]"
                            : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {step.complete ? (
                        <Check className="h-5 w-5 stroke-[2.5]" />
                      ) : step.locked ? (
                        <Lock className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <StepIcon className="h-5 w-5" strokeWidth={2} />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-center text-xs font-semibold ${
                        step.complete
                          ? "text-emerald-700"
                          : active
                            ? "text-[#0066cc]"
                            : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8 p-7 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Complete onboarding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Save each required step to unlock work and payments.
            </p>
          </div>

          {state.message ? (
            <div
              className={`rounded-xl border p-3 text-sm ${
                state.status === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          {onboarding.complete ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold">Onboarding complete</p>
                <p className="text-xs text-emerald-700">
                  Your onboarding state is saved to your account.
                </p>
              </div>
            </div>
          ) : null}

          <section>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Legal documents
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Sign both agreements before continuing.
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:border-slate-300">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
                    <Shield className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Non-Disclosure Agreement
                    </h4>
                    {ndaSigned ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Needs signature
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openSignModal("nda")}
                  className={
                    ndaSigned
                      ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      : "rounded-xl bg-[#0066cc] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0052a3]"
                  }
                >
                  {ndaSigned ? "View Signed" : "Sign"}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:border-slate-300">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
                    <FileText className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Data Submission Form
                    </h4>
                    {dataSubmissionSigned ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Needs signature
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openSignModal("dataSubmission")}
                  className={
                    dataSubmissionSigned
                      ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      : "rounded-xl bg-[#0066cc] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0052a3]"
                  }
                >
                  {dataSubmissionSigned ? "View Signed" : "Sign"}
                </button>
              </div>
            </div>

            {onboarding.legalComplete ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">Legal documents saved</p>
                  <p className="text-xs text-emerald-700">
                    Your legal agreements were recorded in the database.
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <form
            className={`space-y-4 border-t border-slate-100 pt-8 ${
              !onboarding.legalComplete ? "opacity-60" : ""
            }`}
            onSubmit={handlePhoneSubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Verify phone
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add the phone number used for account updates.
                </p>
              </div>
              {onboarding.phoneVerified ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              ) : null}
            </div>
            <fieldset
              className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr]"
              disabled={!onboarding.legalComplete || saving}
            >
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Code
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) => setPhoneCountryCode(event.target.value)}
                  required
                  value={phoneCountryCode}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Phone number
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="555 123 4567"
                  required
                  value={phoneNumber}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Verification code
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  inputMode="numeric"
                  onChange={(event) => setVerificationCode(event.target.value)}
                  required
                  value={verificationCode}
                />
              </label>
            </fieldset>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0066cc] px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!onboarding.legalComplete || saving}
              type="submit"
            >
              {onboarding.phoneVerified ? "Update Phone" : "Verify Phone"}
            </button>
          </form>

          <form
            className={`space-y-4 border-t border-slate-100 pt-8 ${
              !onboarding.phoneVerified ? "opacity-60" : ""
            }`}
            onSubmit={handleIdentitySubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Verify identity
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Confirm the legal identity attached to this account.
                </p>
              </div>
              {onboarding.identityVerified ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Verified
                </span>
              ) : null}
            </div>
            <fieldset
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              disabled={!onboarding.phoneVerified || saving}
            >
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Legal name
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) => setIdentityLegalName(event.target.value)}
                  required
                  value={identityLegalName}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Date of birth
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) =>
                    setIdentityDateOfBirth(event.target.value)
                  }
                  required
                  type="date"
                  value={identityDateOfBirth}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Document type
                </span>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) =>
                    setIdentityDocumentType(event.target.value)
                  }
                  value={identityDocumentType}
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver license</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  Document last 4
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  maxLength={4}
                  minLength={4}
                  onChange={(event) =>
                    setIdentityDocumentLast4(event.target.value)
                  }
                  required
                  value={identityDocumentLast4}
                />
              </label>
            </fieldset>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0066cc] px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!onboarding.phoneVerified || saving}
              type="submit"
            >
              {onboarding.identityVerified
                ? "Update Identity"
                : "Verify Identity"}
            </button>
          </form>

          <form
            className={`space-y-4 border-t border-slate-100 pt-8 ${
              !onboarding.identityVerified ? "opacity-60" : ""
            }`}
            onSubmit={handlePaymentSubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Set up payments
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose where approved payouts should be sent.
                </p>
              </div>
              {onboarding.paymentsSetup ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Ready
                </span>
              ) : null}
            </div>
            <fieldset
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              disabled={!onboarding.identityVerified || saving}
            >
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Payout method
                </span>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as PayoutMethod)
                  }
                  value={paymentMethod}
                >
                  {payoutMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  Destination
                </span>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                  onChange={(event) => setPaymentDestination(event.target.value)}
                  placeholder={paymentPlaceholders[paymentMethod]}
                  required
                  value={paymentDestination}
                />
              </label>
            </fieldset>
            <button
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0066cc] px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!onboarding.identityVerified || saving}
              type="submit"
            >
              {onboarding.paymentsSetup ? "Update Payments" : "Save Payments"}
            </button>
          </form>
        </div>
      </div>

      {/* Signing Modal */}
      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeModal === "nda"
                    ? "Non-Disclosure Agreement"
                    : "Data Submission and Ownership Agreement"}
                </h3>
                <p className="text-xs text-slate-500">
                  Review and sign the document below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Document Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 text-xs leading-relaxed text-slate-700 space-y-4">
              {activeModal === "nda" ? (
                <div className="space-y-4">
                  <div className="text-center pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">
                      NON‑DISCLOSURE AGREEMENT
                    </h4>
                    <p className="mt-1 text-slate-500 text-[11px]">
                      Cronus Technologies, Inc., d/b/a AfterQuery
                    </p>
                  </div>

                  <p>
                    This Non‑Disclosure Agreement (the &ldquo;Agreement&rdquo;)
                    is entered into as of the date of the last signature below
                    (the &ldquo;Effective Date&rdquo;) by and between Cronus
                    Technologies, Inc., d/b/a AfterQuery, (the
                    &ldquo;Discloser&rdquo; or &ldquo;AfterQuery&rdquo;) and the
                    contractor identified below (the &ldquo;Recipient&rdquo;).
                    The Discloser intends to provide certain confidential
                    information to the Recipient in connection with the
                    Recipient’s performance of services for AfterQuery (the
                    &ldquo;Purpose&rdquo;). In consideration of receiving such
                    Confidential Information, the Recipient agrees as follows:
                  </p>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      1. Definition of Confidential Information
                    </h5>
                    <p className="mt-1">
                      &ldquo;Confidential Information&rdquo; means any
                      information or data disclosed by the Discloser to the
                      Recipient, whether in oral, written, electronic, or any
                      other form, that is either (a) clearly marked or
                      identified as &ldquo;confidential&rdquo; or
                      &ldquo;proprietary&rdquo; at the time of disclosure, or
                      (b) such that a reasonable person would understand it to
                      be confidential given the nature of the information and
                      the circumstances surrounding its disclosure.
                      Confidential Information includes, but is not limited to,
                      business plans, technical data, product plans,
                      strategies, financial information, customer lists, and
                      other sensitive business information.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      2. Obligations of the Recipient
                    </h5>
                    <p className="mt-1">
                      (a) <strong>Non-Disclosure.</strong> The Recipient shall
                      keep all Confidential Information strictly confidential
                      and shall not, without the prior written consent of the
                      Discloser, disclose or permit disclosure of any
                      Confidential Information to any third party.
                    </p>
                    <p className="mt-1">
                      (b) <strong>Limited Use.</strong> The Recipient shall use
                      the Confidential Information solely for the Purpose and
                      for no other purpose.
                    </p>
                    <p className="mt-1">
                      (c) <strong>Care.</strong> The Recipient shall take
                      reasonable steps to protect the confidentiality of the
                      Confidential Information, at least equivalent to the care
                      it uses for its own confidential information, but in no
                      event less than a reasonable standard of care.
                    </p>
                    <p className="mt-1">
                      (d) <strong>Permitted Disclosures.</strong> The Recipient
                      may disclose Confidential Information only to its
                      employees, agents, or subcontractors who (i) have a need to
                      know such information for the Purpose, and (ii) are bound
                      by confidentiality obligations no less protective than
                      those set forth in this Agreement. The Recipient shall
                      remain fully responsible for any breach of this Agreement
                      by any such persons.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">3. Exclusions</h5>
                    <p className="mt-1">
                      The obligations in Section 2 shall not apply to any
                      information that:
                      <br />
                      (a) was known to the Recipient without restriction prior to
                      disclosure by the Discloser;
                      <br />
                      (b) becomes publicly available through no act or omission
                      of the Recipient;
                      <br />
                      (c) is received from a third party without breach of any
                      obligation of confidentiality; or
                      <br />
                      (d) is independently developed by the Recipient without use
                      of or reference to the Confidential Information.
                    </p>
                    <p className="mt-1">
                      If the Recipient is required by law, regulation, or court
                      order to disclose any Confidential Information, the
                      Recipient shall, to the extent legally permissible,
                      promptly notify the Discloser in writing prior to making
                      any such disclosure and cooperate with the Discloser in
                      seeking a protective order or other appropriate remedy.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">4. Disclaimer</h5>
                    <p className="mt-1">
                      All Confidential Information is provided &ldquo;AS
                      IS&rdquo; without any warranties, express or implied,
                      regarding its accuracy.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      5. Ownership and No License
                    </h5>
                    <p className="mt-1">
                      All Confidential Information shall remain the exclusive
                      property of the Discloser. Nothing in this Agreement grants
                      the Recipient any rights, by license or otherwise, to any
                      of the Discloser’s intellectual property or Confidential
                      Information, except for the limited right to use such
                      Confidential Information solely for the Purpose.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      6. Term and Duration
                    </h5>
                    <p className="mt-1">
                      This Agreement shall become effective on the Effective Date
                      and remain in effect until terminated by either party upon
                      thirty (30) days’ written notice. Notwithstanding any
                      termination, the Recipient’s obligation to protect
                      Confidential Information disclosed prior to termination
                      shall survive for a period of five (5) years from the date
                      of disclosure, except that any Confidential Information
                      that qualifies as a trade secret shall be subject to an
                      indefinite confidentiality obligation.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      7. Return or Destruction of Confidential Information
                    </h5>
                    <p className="mt-1">
                      Upon the Discloser’s written request, the Recipient shall
                      promptly return or destroy all materials containing
                      Confidential Information, including all copies, notes, or
                      summaries thereof.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      8. Equitable Relief
                    </h5>
                    <p className="mt-1">
                      The Recipient acknowledges that any breach of this
                      Agreement may cause the Discloser irreparable harm for
                      which monetary damages may be inadequate. Accordingly, the
                      Discloser shall be entitled to seek injunctive or other
                      equitable relief to enforce the terms of this Agreement, in
                      addition to any other rights or remedies available at law
                      or in equity.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">9. No Assignment</h5>
                    <p className="mt-1">
                      This Agreement is personal to the Recipient and may not be
                      assigned or transferred, in whole or in part, without the
                      prior written consent of the Discloser.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      10. Governing Law and Jurisdiction
                    </h5>
                    <p className="mt-1">
                      This Agreement shall be governed by and construed in
                      accordance with the laws of the State of California,
                      without regard to its conflict of law principles. The
                      Recipient agrees to submit to the exclusive jurisdiction of
                      the state and federal courts located in San Francisco,
                      California for any disputes arising out of or relating to
                      this Agreement.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      11. Entire Agreement
                    </h5>
                    <p className="mt-1">
                      This Agreement constitutes the entire understanding
                      between the parties with respect to the subject matter
                      hereof and supersedes all prior discussions, agreements, or
                      understandings of any kind. No amendment or modification
                      of this Agreement shall be valid unless in writing and
                      signed by both parties. The failure of the Discloser to
                      enforce any provision of this Agreement shall not be
                      construed as a waiver of that provision.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="font-semibold text-slate-800">
                      IN WITNESS WHEREOF, the parties have executed this
                      One‑Sided Non‑Disclosure Agreement as of the dates set
                      forth below.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-[11px]">
                      <div>
                        <p className="font-bold text-slate-900">
                          AfterQuery (Discloser)
                        </p>
                        <p className="mt-1">
                          Signature: <em>Cronus Technologies, Inc.</em>
                        </p>
                        <p>Name: Legal Operations</p>
                        <p>Title: Authorized Representative</p>
                        <p>Date: {todayFormatted}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Contractor (Recipient)
                        </p>
                        <p className="mt-1">
                          Signature:{" "}
                          <span className="font-serif italic text-blue-700">
                            {signatureText || signerName}
                          </span>
                        </p>
                        <p>Name: {signerName}</p>
                        <p>Title: {signerTitle}</p>
                        <p>Date: {todayFormatted}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">
                      DATA SUBMISSION AND OWNERSHIP AGREEMENT
                    </h4>
                    <p className="mt-1 text-slate-500 text-[11px]">
                      Cronus Technologies, Inc., d/b/a AfterQuery
                    </p>
                  </div>

                  <p>
                    This Data Submission and Ownership Agreement
                    (&ldquo;Agreement&rdquo;) is entered into by and between
                    Cronus Technologies, Inc., d/b/a AfterQuery, a Delaware
                    corporation with its registered office in the state of
                    Delaware at 251 Little Falls Drive, Wilmington, New Castle
                    County (&ldquo;Company&rdquo;), and any individual or entity
                    (&ldquo;User&rdquo;) submitting data, including but not
                    limited to Google Sheets, Excel models, documents, and other
                    data files, through experts.afterquery.com
                    (&ldquo;Website&rdquo; or &ldquo;Platform&rdquo;).
                  </p>
                  <p>
                    By submitting data to the Website, User agrees to the
                    following terms:
                  </p>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      OWNERSHIP AND RIGHTS
                    </h5>
                    <p className="mt-1">
                      1.1 By submitting any content, data, files, documents,
                      spreadsheets, financial models or other materials
                      (&quot;Submitted Materials&quot;) to the Company through
                      any means, User immediately and irrevocably grants,
                      transfers and assigns to Company all right, title and
                      interest worldwide in and to such Submitted Materials,
                      including all intellectual property rights therein,
                      without any restrictions or limitations whatsoever and
                      without any requirement for additional consideration.
                    </p>
                    <p className="mt-1">
                      1.2 Company shall have the unrestricted right to use,
                      modify, adapt, reproduce, distribute, publish, display,
                      perform, sell, lease, transmit, or otherwise dispose of the
                      Submitted Materials in any way and for any purpose,
                      commercial or non-commercial, through any means, media,
                      technology or processes, whether currently known or
                      developed in the future.
                    </p>
                    <p className="mt-1">
                      1.3 User hereby irrevocably waives and agrees not to
                      assert any and all moral rights, rights of attribution, or
                      other similar rights in connection with the Submitted
                      Materials to the fullest extent permitted by law.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      DATA HANDLING AND MONETIZATION
                    </h5>
                    <p className="mt-1">
                      2.1 Company has complete discretion regarding the handling,
                      storage, use, sale, licensing, distribution, aggregation,
                      analysis, modification, combination, or other exploitation
                      of Submitted Materials, including but not limited to:
                      <br />- Sale or licensing to third parties
                      <br />- Incorporation into products or services
                      <br />- Use for marketing, advertising or promotional
                      purposes
                      <br />- Analysis and creation of derivative works
                      <br />- Combination with other data sources
                      <br />- Any other commercial or non-commercial purpose
                    </p>
                    <p className="mt-1">
                      2.2 <strong>No Confidentiality or Restrictions.</strong>{" "}
                      Unless explicitly agreed to in a separate written
                      agreement signed by an authorized Company representative,
                      Company has no confidentiality obligations regarding
                      Submitted Materials and may freely disclose them to any
                      third parties.
                    </p>
                    <p className="mt-1">
                      2.3 <strong>Perpetual Rights.</strong> Company&apos;s rights
                      to Submitted Materials survive indefinitely regardless of
                      any termination of User&apos;s account or relationship
                      with Company.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      COMPLIANCE AND PRIVACY
                    </h5>
                    <p className="mt-1">
                      3.1 <strong>Privacy Laws.</strong> For Submitted Materials
                      containing personal information as defined under
                      applicable privacy laws:
                      <br />- Company will process such data in accordance with
                      its Privacy Policy and applicable laws
                      <br />- User warrants they have obtained all necessary
                      rights, consents and authorizations for Company&apos;s
                      intended uses
                      <br />- User is solely responsible for ensuring their
                      submission complies with all applicable privacy laws
                      <br />- Company may retain and use data as needed for
                      legal compliance, security, or other legitimate business
                      purposes even if deletion is requested
                    </p>
                    <p className="mt-1">
                      3.2 <strong>Third Party Data.</strong> For any Submitted
                      Materials containing information about third parties:
                      <br />- User warrants they have explicit authorization to
                      provide such information
                      <br />- User has informed third parties of Company&apos;s
                      intended uses
                      <br />- User will indemnify Company against any claims from
                      such third parties
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900">
                      WARRANTIES AND INDEMNIFICATION
                    </h5>
                    <p className="mt-1">
                      4.1 User represents and warrants that:
                      <br />- They have all rights needed to grant Company the
                      rights specified herein
                      <br />- Submitted Materials do not violate any laws or
                      third party rights
                      <br />- Submitted Materials are accurate and free from
                      harmful code
                      <br />- Their submission and Company&apos;s use will not
                      create any liability for Company
                      <br />- They will not make any claims against Company
                      regarding Submitted Materials
                    </p>
                    <p className="mt-1">
                      4.2 User shall defend, indemnify and hold harmless Company
                      and its affiliates, directors, employees and agents from
                      any claims, damages, liabilities, costs or expenses
                      (including attorney fees) arising from:
                      <br />- Any breach of these terms
                      <br />- Company&apos;s use of Submitted Materials
                      <br />- Third party claims regarding Submitted Materials
                      <br />- Any misrepresentations regarding Submitted
                      Materials
                    </p>
                    <p className="mt-1">
                      4.3 <strong>Disclaimer.</strong> Company provides no
                      warranties regarding its handling or use of Submitted
                      Materials. User submits materials entirely at their own
                      risk.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="font-semibold text-slate-800">
                      IN WITNESS WHEREOF, the parties have executed this data
                      submission and ownership agreement set forth below.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-[11px]">
                      <div>
                        <p className="font-bold text-slate-900">
                          AfterQuery (Company)
                        </p>
                        <p className="mt-1">
                          Signature: <em>Cronus Technologies, Inc.</em>
                        </p>
                        <p>Name: Legal Operations</p>
                        <p>Title: Authorized Signatory</p>
                        <p>Date: {todayFormatted}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">User</p>
                        <p className="mt-1">
                          Signature:{" "}
                          <span className="font-serif italic text-blue-700">
                            {signatureText || signerName}
                          </span>
                        </p>
                        <p>Name: {signerName}</p>
                        <p>Title: {signerTitle}</p>
                        <p>Date: {todayFormatted}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Signature Input Controls */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 pt-3 mt-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Electronic Signature
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => {
                        setSignerName(e.target.value);
                        setSignatureText(e.target.value);
                      }}
                      placeholder="Your full name"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">
                      Title
                    </label>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      placeholder="Title / Role"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600">
                    Signature Preview
                  </label>
                  <div className="mt-1 flex h-11 items-center rounded-lg border border-slate-200 bg-white px-4 font-serif text-lg italic text-[#0066cc]">
                    {signatureText || signerName || "Sign here"}
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-700">
                    I acknowledge that I have read, understood, and agree to be
                    legally bound by all terms and conditions of this Agreement.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSignConfirm}
                disabled={saving || !agreed || !signerName.trim()}
                className="rounded-xl bg-[#0066cc] px-6 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Sign & Accept"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
