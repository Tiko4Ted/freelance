import { z } from "zod";

function isLinkedInProfileUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      (url.hostname === "linkedin.com" || url.hostname === "www.linkedin.com") &&
      /^\/in\/[^/]+\/?$/i.test(url.pathname) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function optionalTrimmedString(max: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z.string().max(max).optional(),
  );
}

export const applicationSchema = z.object({
  jobId: z.string().uuid(),
  candidateName: optionalTrimmedString(120),
  candidateFirstName: optionalTrimmedString(60),
  candidateLastName: optionalTrimmedString(60),
  candidatePhoneCountry: optionalTrimmedString(80),
  candidatePhoneCountryCode: optionalTrimmedString(10),
  candidatePhoneNumber: optionalTrimmedString(30),
  candidateLinkedinUrl: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z
      .string()
      .url()
      .max(300)
      .refine(isLinkedInProfileUrl, "Enter a valid LinkedIn profile URL"),
  ),
  resumeFileName: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .string()
      .min(1, "Resume PDF is required")
      .max(255)
      .regex(/\.pdf$/i, "Upload your resume as a PDF"),
  ),
  startAvailabilityDays: z.coerce.number().int().min(0).max(365).optional(),
  expectedHourlyRateUsd: z.coerce.number().int().min(1).max(10000).optional(),
  weeklyAvailabilityHours: z.coerce.number().int().min(1).max(168).optional(),
  strongestTools: z.array(z.string().trim().min(1).max(80)).optional().default([]),
  aptitudeAnswers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1).max(80),
        selectedOptionId: z.string().trim().min(1).max(20),
      }),
    )
    .min(15),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
