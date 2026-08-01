import { z } from "zod";

export const taskSubmissionSchema = z.object({
  fileName: z.string().trim().min(2).max(240),
  notes: z.string().trim().max(1200).optional().default(""),
});

export type TaskSubmissionInput = z.infer<typeof taskSubmissionSchema>;
