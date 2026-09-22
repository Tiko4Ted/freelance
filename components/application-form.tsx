"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  ApplicationErrorDialog,
  type SubmitState,
} from "@/components/application-feedback";
import {
  applicationDraftStorageKey,
  type StoredApplicationDraft,
} from "@/lib/application-draft";

type ApplicationFormProps = {
  aptitudeHref: string;
  applicantEmail: string;
  jobId: string;
};

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

export function ApplicationForm({
  aptitudeHref,
  applicantEmail,
  jobId,
}: ApplicationFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const [resumeName, setResumeName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(defaultPhoneCountry);

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

    const storedDraft: StoredApplicationDraft = {
      jobId,
      candidateName: `${firstName} ${lastName}`.trim(),
      candidateFirstName: firstName,
      candidateLastName: lastName,
      candidatePhoneCountry: detectedPhoneCountry.country,
      candidatePhoneCountryCode: detectedPhoneCountry.code,
      candidatePhoneNumber: phoneNumber,
      candidateLinkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      resumeFileName: resumeName,
    };

    try {
      sessionStorage.setItem(
        applicationDraftStorageKey(jobId),
        JSON.stringify(storedDraft),
      );
      setPhoneCountry(detectedPhoneCountry);
      setState({ status: "idle", message: "" });
      router.push(aptitudeHref);
    } catch {
      setState({
        status: "error",
        message: "Unable to continue to the aptitude test",
      });
    }
  }

  return (
    <>
      {state.status === "error" && state.message ? (
        <ApplicationErrorDialog
          message={state.message}
          onClose={() => setState({ status: "idle", message: "" })}
        />
      ) : null}
      <form
        className="rounded-lg border border-brand-sand bg-brand-ivory p-6 text-brand-ink shadow-brand-card"
        onSubmit={handleDetailsNext}
      >
        <h2 className="text-[22px] font-semibold leading-tight">Interested?</h2>
      <p className="mt-2 text-[12px] leading-[1.45] text-brand-muted">
        Applying with{" "}
        <span className="font-semibold text-brand-ink">{applicantEmail}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="text-[11px] font-medium text-brand-ink"
            htmlFor="firstName"
          >
            First name
          </label>
          <input
            className="mt-1.5 h-9 w-full rounded border border-brand-sand bg-brand-canvas/50 px-3 text-[13px] outline-none transition placeholder:text-brand-muted focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            id="firstName"
            name="firstName"
            placeholder="Enter your first name"
            required
            minLength={1}
          />
        </div>
        <div>
          <label
            className="text-[11px] font-medium text-brand-ink"
            htmlFor="lastName"
          >
            Last name
          </label>
          <input
            className="mt-1.5 h-9 w-full rounded border border-brand-sand bg-brand-canvas/50 px-3 text-[13px] outline-none transition placeholder:text-brand-muted focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
          className="text-[11px] font-medium text-brand-ink"
          htmlFor="phoneNumber"
        >
          Phone number
        </label>
        <div className="mt-1.5 flex h-10 overflow-hidden rounded border border-brand-sand bg-brand-canvas/50 transition focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold">
          <div className="flex min-w-[86px] items-center gap-2 border-r border-brand-sand px-3 text-[13px] text-brand-ink">
            <span aria-hidden="true" className="text-base leading-none">
              {phoneCountry.label}
            </span>
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-brand-muted" />
            <span className="sr-only">
              Country: {phoneCountry.country} {phoneCountry.code}
            </span>
          </div>
          <input
            className="min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none placeholder:text-brand-muted"
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
          className="text-[11px] font-medium text-brand-ink"
          htmlFor="linkedinUrl"
        >
          Linkedin profile URL
        </label>
        <input
          className="mt-1.5 h-9 w-full rounded border border-brand-sand bg-brand-canvas/50 px-3 text-[13px] outline-none transition placeholder:text-brand-muted focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          id="linkedinUrl"
          name="linkedinUrl"
          placeholder="Enter your LinkedIn URL"
          type="url"
        />
      </div>

      <div className="mt-4">
        <label
          className="text-[11px] font-medium text-brand-ink"
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
          className="mt-1.5 flex h-9 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-brand-muted bg-brand-canvas/50 px-3 text-center text-[13px] text-brand-muted transition hover:border-brand-gold hover:text-brand-gold-strong focus-within:ring-2 focus-within:ring-brand-gold/30"
          htmlFor="resume"
        >
          <Upload aria-hidden="true" className="h-4 w-4" />
          <span className="truncate">
            {resumeName || "Click to upload or drag & drop (.pdf)"}
          </span>
        </label>
      </div>

      <button
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-ink px-5 text-[15px] font-semibold text-brand-ivory shadow-sm transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40 disabled:cursor-not-allowed disabled:opacity-65"
        type="submit"
      >
        Next
      </button>

      <p className="mt-5 text-[11px] leading-[1.45] text-brand-muted">
        Please note that after completing the interview process, you will be
        considered for this and other roles that match your skills.
      </p>

      <p className="mt-4 text-[12px] text-brand-muted">
        Have any questions? See{" "}
        <a className="font-medium text-brand-gold-strong underline-offset-2 hover:underline" href="#">
          FAQs
        </a>
      </p>

      </form>
    </>
  );
}
