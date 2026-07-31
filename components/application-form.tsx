"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, Upload } from "lucide-react";

type ApplicationFormProps = {
  jobId: string;
};

type SubmitState =
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

  return "Unable to submit application";
}

export function ApplicationForm({ jobId }: ApplicationFormProps) {
  const [state, setState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });
  const [resumeName, setResumeName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting", message: "Submitting application" });

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const candidateName = `${firstName} ${lastName}`.trim();
    const candidateEmail = String(formData.get("candidateEmail") ?? "");
    const candidatePhoneNumber = String(formData.get("phoneNumber") ?? "");
    const candidateLinkedinUrl = String(formData.get("linkedinUrl") ?? "");

    const response = await fetch("/api/v1/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        candidateName,
        candidateEmail,
        candidateFirstName: firstName,
        candidateLastName: lastName,
        candidatePhoneCountry: "Kenya",
        candidatePhoneCountryCode: "+254",
        candidatePhoneNumber,
        candidateLinkedinUrl,
        resumeFileName: resumeName,
      }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
      setState({ status: "error", message: getErrorMessage(payload) });
      return;
    }

    event.currentTarget.reset();
    setResumeName("");
    setState({ status: "success", message: "Application submitted" });
  }

  return (
    <form className="rounded-lg bg-[#f2f1fb] p-6 text-[#151625]" onSubmit={handleSubmit}>
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
              KE
            </span>
            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-[#636574]" />
            <span className="sr-only">Country</span>
          </div>
          <input
            className="min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none placeholder:text-[#848594]"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="+254"
            type="tel"
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
        disabled={state.status === "submitting"}
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
