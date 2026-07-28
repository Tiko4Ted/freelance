import { z } from "zod";

export const applicationSchema = z.object({
  jobId: z.string().uuid(),
  candidateName: z.string().trim().min(2).max(120),
  candidateEmail: z.string().email().transform((value) => value.toLowerCase()),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
