"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, Minus, Plus, Upload, X } from "lucide-react";

type ApplicationFormProps = {
  jobId: string;
};

type FormStep = "details" | "questions";

type ApplicationDraft = {
  candidateName: string;
  candidateEmail: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidatePhoneCountry: string;
  candidatePhoneCountryCode: string;
  candidatePhoneNumber: string;
  candidateLinkedinUrl: string;
  resumeFileName: string;
};

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const toolOptions = [
  "Salesforce",
  "HubSpot",
  "Freshdesk",
  "Intercom",
  "Apollo",
  "Crayon",
  "Close",
  "Salesloft",
  "Shopify",
  "Funnel",
];

const phoneCountries = [
  { country: "United States", code: "+1", label: "US" },
  { country: "Canada", code: "+1", label: "CA" },
  { country: "United Kingdom", code: "+44", label: "GB" },
  { country: "Kenya", code: "+254", label: "KE" },
  { country: "Nigeria", code: "+234", label: "NG" },
  { country: "South Africa", code: "+27", label: "ZA" },
  { country: "Ghana", code: "+233", label: "GH" },
  { country: "Uganda", code: "+256", label: "UG" },
  { country: "Tanzania", code: "+255", label: "TZ" },
  { country: "Rwanda", code: "+250", label: "RW" },
  { country: "India", code: "+91", label: "IN" },
  { country: "Pakistan", code: "+92", label: "PK" },
  { country: "Brazil", code: "+55", label: "BR" },
  { country: "Mexico", code: "+52", label: "MX" },
  { country: "Germany", code: "+49", label: "DE" },
  { country: "France", code: "+33", label: "FR" },
  { country: "Italy", code: "+39", label: "IT" },
  { country: "Netherlands", code: "+31", label: "NL" },
  { country: "Spain", code: "+34", label: "ES" },
  { country: "China", code: "+86", label: "CN" },
  { country: "Japan", code: "+81", label: "JP" },
  { country: "South Korea", code: "+82", label: "KR" },
  { country: "Australia", code: "+61", label: "AU" },
].sort((first, second) => second.code.length - first.code.length);

const defaultPhoneCountry = phoneCountries.find(
  (country) => country.code === "+254",
) ?? {
  country: "Kenya",
  code: "+254",
  label: "KE",
};

function detectPhoneCountry(phoneNumber: string) {
  const trimmedPhoneNumber = phoneNumber.trim();

  if (!trimmedPhoneNumber.startsWith("+") && !trimmedPhoneNumber.startsWith("00")) {
    return defaultPhoneCountry;
  }

  const normalizedPhoneCode = trimmedPhoneNumber.startsWith("00")
    ? `+${trimmedPhoneNumber.slice(2).replace(/\D/g, "")}`
    : `+${trimmedPhoneNumber.slice(1).replace(/\D/g, "")}`;

  return (
    phoneCountries.find((country) =>
      normalizedPhoneCode.startsWith(country.code),
    ) ?? defaultPhoneCountry
  );
}

function getErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Unable to submit application";
}

function NumberStepper({
  label,
  name,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  function setBoundedValue(nextValue: number) {
    onChange(Math.min(max, Math.max(min, nextValue)));
  }

  return (
    <div>
      <label className="text-[11px] font-medium text-[#242634]" htmlFor={name}>
        {label}
      </label>
      <div className="mt-2 grid h-10 grid-cols-[2.5rem_1fr_2.5rem] items-center rounded border border-[#d0d0dc] bg-transparent">
        <button
          aria-label={`Decrease ${label}`}
          className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded bg-white text-[#3142ff] transition hover:bg-[#e5e8ff]"
          onClick={() => setBoundedValue(value - 1)}
          type="button"
        >
          <Minus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <input
          className="h-full min-w-0 bg-transparent text-center text-[14px] font-semibold text-[#151625] outline-none"
          id={name}
          max={max}
          min={min}
          name={name}
          onChange={(event) => setBoundedValue(Number(event.target.value))}
          type="number"
          value={value}
        />
        <button
          aria-label={`Increase ${label}`}
          className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded bg-white text-[#3142ff] transition hover:bg-[#e5e8ff]"
          onClick={() => setBoundedValue(value + 1)}
          type="button"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ApplicationForm({ jobId }: ApplicationFormProps) {
  const [step, setStep] = useState<FormStep>("details");
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(defaultPhoneCountry);
  const [startAvailabilityDays, setStartAvailabilityDays] = useState(1);
  const [expectedHourlyRateUsd, setExpectedHourlyRateUsd] = useState(1);
  const [weeklyAvailabilityHours, setWeeklyAvailabilityHours] = useState(1);
  const [strongestTools, setStrongestTools] = useState<string[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);

  function handleDetailsNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const detectedPhoneCountry = detectPhoneCountry(phoneNumber);

    setDraft({
      candidateName: `${firstName} ${lastName}`.trim(),
      candidateEmail: String(formData.get("candidateEmail") ?? ""),
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidatePhoneCountry: detectedPhoneCountry.country,
      candidatePhoneCountryCode: detectedPhoneCountry.code,
      candidatePhoneNumber: phoneNumber,
      candidateLinkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      resumeFileName: resumeName,
    });
    setPhoneCountry(detectedPhoneCountry);
    setState({ status: "idle", message: "" });
    setStep("questions");
  }

  async function handleFinalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) {
      setState({ status: "error", message: "Complete your details first" });
      setStep("details");
      return;
    }

    setState({ status: "submitting", message: "Submitting application" });

    const response = await fetch("/api/v1/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        ...draft,
        startAvailabilityDays,
        expectedHourlyRateUsd,
        weeklyAvailabilityHours,
        strongestTools,
      }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(payload) });
      return;
    }

    setState({ status: "success", message: "Application submitted" });
  }

  function toggleTool(tool: string) {
    setStrongestTools((currentTools) =>
      currentTools.includes(tool)
        ? currentTools.filter((item) => item !== tool)
        : [...currentTools, tool],
    );
    setToolsOpen(false);
  }

  if (step === "questions") {
    return (
      <form
        className="rounded-lg bg-[#f2f1fb] p-6 text-[#151625]"
        onSubmit={handleFinalSubmit}
      >
        <h2 className="text-[20px] font-semibold leading-[1.35]">
          Answer a few questions to complete your application
        </h2>

        <div className="mt-5 space-y-5">
          <NumberStepper
            label="Q1. How soon can you start the work? (in days)"
            max={365}
            min={0}
            name="startAvailabilityDays"
            onChange={setStartAvailabilityDays}
            value={startAvailabilityDays}
          />

          <div>
            <label
              className="text-[11px] font-medium text-[#242634]"
              htmlFor="expectedHourlyRateUsd"
            >
              Q2. What is your expected hourly rate in USD?
            </label>
            <div className="mt-2 flex h-9 overflow-hidden rounded border border-[#d0d0dc] bg-transparent">
              <input
                className="min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none"
                id="expectedHourlyRateUsd"
                min={1}
                name="expectedHourlyRateUsd"
                onChange={(event) =>
                  setExpectedHourlyRateUsd(
                    Math.max(1, Number(event.target.value)),
                  )
                }
                type="number"
                value={expectedHourlyRateUsd}
              />
              <span className="flex items-center px-3 text-[13px] font-medium text-[#151625]">
                /hour
              </span>
            </div>
          </div>

          <NumberStepper
            label="Q3. How many hours per week are you available to work?"
            max={168}
            min={1}
            name="weeklyAvailabilityHours"
            onChange={setWeeklyAvailabilityHours}
            value={weeklyAvailabilityHours}
          />

          <div className="relative">
            <p className="text-[11px] font-medium leading-[1.45] text-[#242634]">
              Q4. Which of the following tools do you have the strongest
              hands-on experience with?
            </p>
            <button
              className="mt-2 flex min-h-16 w-full items-center gap-2 rounded border border-[#d0d0dc] bg-transparent px-3 py-2 text-left text-[12px] text-[#252735]"
              onClick={() => setToolsOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span className="flex flex-1 flex-wrap gap-x-4 gap-y-2">
                {strongestTools.length ? (
                  strongestTools.map((tool) => (
                    <span className="inline-flex items-center gap-2" key={tool}>
                      {tool}
                      <span
                        aria-hidden="true"
                        className="text-[15px] font-semibold leading-none text-[#151625]"
                      >
                        x
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-[#787a88]">Select options...</span>
                )}
              </span>
              <X aria-hidden="true" className="h-4 w-4 text-[#676977]" />
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-[#676977]" />
            </button>
            {toolsOpen ? (
              <div className="absolute left-0 right-0 z-10 mt-1 grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded border border-[#d0d0dc] bg-white p-2 shadow-lg">
                {toolOptions.map((tool) => (
                  <button
                    className={
                      strongestTools.includes(tool)
                        ? "rounded bg-[#e7eaff] px-2 py-1.5 text-left text-[12px] font-medium text-[#1c2bd7]"
                        : "rounded px-2 py-1.5 text-left text-[12px] text-[#343643] hover:bg-[#f2f1fb]"
                    }
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    type="button"
                  >
                    {tool}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#e2e6ff] px-5 text-[15px] font-semibold text-[#252735] transition hover:bg-[#d9defd]"
            onClick={() => {
              setState({ status: "idle", message: "" });
              setStep("details");
            }}
            type="button"
          >
            Back
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-[#3e52ff] to-[#1723a7] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:from-[#3345f0] hover:to-[#101a91] disabled:cursor-not-allowed disabled:opacity-65"
            disabled={state.status === "submitting"}
            type="submit"
          >
            Submit
          </button>
        </div>

        {state.message ? (
          <p
            className={
              state.status === "error"
                ? "mt-4 text-[12px] font-medium text-red-700"
                : "mt-4 text-[12px] font-medium text-[#096d5e]"
            }
          >
            {state.message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      className="rounded-lg bg-[#f2f1fb] p-6 text-[#151625]"
      onSubmit={handleDetailsNext}
    >
      <h2 className="text-[22px] font-semibold leading-tight">Interested?</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="text-[11px] font-medium text-[#363747]"
            htmlFor="firstName"
          >
            First name
          </label>
          <input
            className="mt-1.5 h-9 w-full rounded border border-[#d0d0dc] bg-transparent px-3 text-[13px] outline-none transition placeholder:text-[#848594] focus:border-[#3547ff] focus:ring-1 focus:ring-[#3547ff]"
            defaultValue={draft?.candidateFirstName}
            id="firstName"
            name="firstName"
            placeholder="Enter your first name"
            required
            minLength={1}
          />
        </div>
        <div>
          <label
            className="text-[11px] font-medium text-[#363747]"
            htmlFor="lastName"
          >
            Last name
          </label>
          <input
            className="mt-1.5 h-9 w-full rounded border border-[#d0d0dc] bg-transparent px-3 text-[13px] outline-none transition placeholder:text-[#848594] focus:border-[#3547ff] focus:ring-1 focus:ring-[#3547ff]"
            defaultValue={draft?.candidateLastName}
            id="lastName"
            name="lastName"
            placeholder="Enter your last name"
            required
            minLength={1}
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          className="text-[11px] font-medium text-[#363747]"
          htmlFor="candidateEmail"
        >
          Email
        </label>
        <input
          className="mt-1.5 h-9 w-full rounded border border-[#d0d0dc] bg-transparent px-3 text-[13px] outline-none transition placeholder:text-[#848594] focus:border-[#3547ff] focus:ring-1 focus:ring-[#3547ff]"
          defaultValue={draft?.candidateEmail}
          id="candidateEmail"
          name="candidateEmail"
          placeholder="Enter your email address"
          required
          type="email"
        />
      </div>

      <div className="mt-4">
        <label
          className="text-[11px] font-medium text-[#363747]"
          htmlFor="phoneNumber"
        >
          Phone number
        </label>
        <div className="mt-1.5 flex h-10 overflow-hidden rounded border border-[#d0d0dc] bg-transparent transition focus-within:border-[#3547ff] focus-within:ring-1 focus-within:ring-[#3547ff]">
          <div className="flex min-w-[86px] items-center gap-2 border-r border-[#d0d0dc] px-3 text-[13px] text-[#222432]">
            <span aria-hidden="true" className="text-base leading-none">
              {phoneCountry.label}
            </span>
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-[#636574]" />
            <span className="sr-only">
              Country: {phoneCountry.country} {phoneCountry.code}
            </span>
          </div>
          <input
            className="min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none placeholder:text-[#848594]"
            id="phoneNumber"
            name="phoneNumber"
            onChange={(event) => {
              const nextPhoneNumber = event.target.value;
              setPhoneNumber(nextPhoneNumber);
              setPhoneCountry(detectPhoneCountry(nextPhoneNumber));
            }}
            placeholder={`${phoneCountry.code} 712 345678`}
            type="tel"
            value={phoneNumber}
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          className="text-[11px] font-medium text-[#363747]"
          htmlFor="linkedinUrl"
        >
          Linkedin profile URL
        </label>
        <input
          className="mt-1.5 h-9 w-full rounded border border-[#d0d0dc] bg-transparent px-3 text-[13px] outline-none transition placeholder:text-[#848594] focus:border-[#3547ff] focus:ring-1 focus:ring-[#3547ff]"
          defaultValue={draft?.candidateLinkedinUrl}
          id="linkedinUrl"
          name="linkedinUrl"
          placeholder="Enter your LinkedIn URL"
          type="url"
        />
      </div>

      <div className="mt-4">
        <label
          className="text-[11px] font-medium text-[#363747]"
          htmlFor="resume"
        >
          Upload your resume (in English)
        </label>
        <input
          accept=".pdf"
          className="sr-only"
          id="resume"
          name="resume"
          onChange={(event) => {
            setResumeName(event.target.files?.[0]?.name ?? "");
          }}
          type="file"
        />
        <label
          className="mt-1.5 flex h-9 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-[#646679] bg-transparent px-3 text-center text-[13px] text-[#333542] transition hover:border-[#3547ff] hover:text-[#2636d9]"
          htmlFor="resume"
        >
          <Upload aria-hidden="true" className="h-4 w-4" />
          <span className="truncate">
            {resumeName || "Click to upload or drag & drop (.pdf)"}
          </span>
        </label>
      </div>

      <button
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-gradient-to-r from-[#3e52ff] to-[#1723a7] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:from-[#3345f0] hover:to-[#101a91] disabled:cursor-not-allowed disabled:opacity-65"
        type="submit"
      >
        Next
      </button>

      <p className="mt-5 text-[11px] leading-[1.45] text-[#3e4050]">
        Please note that after completing the interview process, you will be
        considered for this and other roles that match your skills.
      </p>

      <p className="mt-4 text-[12px] text-[#3e4050]">
        Have any questions? See{" "}
        <a className="text-[#2738d9] underline-offset-2 hover:underline" href="#">
          FAQs
        </a>
      </p>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "mt-4 text-[12px] font-medium text-red-700"
              : "mt-4 text-[12px] font-medium text-[#096d5e]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
