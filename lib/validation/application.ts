import { z } from "zod";

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
  candidateName: z.string().trim().min(2).max(120),
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
    z.string().url().max(300).optional(),
  ),
  resumeFileName: optionalTrimmedString(255),
  startAvailabilityDays: z.coerce.number().int().min(0).max(365).optional(),
  expectedHourlyRateUsd: z.coerce.number().int().min(1).max(10000).optional(),
  weeklyAvailabilityHours: z.coerce.number().int().min(1).max(168).optional(),
  strongestTools: z.array(z.string().trim().min(1).max(80)).optional().default([]),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
