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
  candidateEmail: z.string().email().transform((value) => value.toLowerCase()),
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
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
