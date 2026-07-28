import { ApplicationStatus, PayoutTrigger } from "@prisma/client";
import { z } from "zod";

export const adminCreateJobSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(4000),
  payoutAmountCents: z.coerce.number().int().positive(),
  payoutType: z
    .enum([PayoutTrigger.HOURS_10, PayoutTrigger.TASK_1])
    .default(PayoutTrigger.HOURS_10),
  currency: z.string().trim().length(3).default("USD"),
  isActive: z.boolean().optional().default(true),
});

export const adminUpdateJobSchema = adminCreateJobSchema.partial();

export const adminStatusSchema = z.object({
  status: z.enum([
    ApplicationStatus.APPLIED,
    ApplicationStatus.CERTIFYING,
    ApplicationStatus.CERTIFIED,
    ApplicationStatus.MATCHED,
    ApplicationStatus.ACTIVE,
    ApplicationStatus.PAYOUT_ELIGIBLE,
    ApplicationStatus.PAID,
    ApplicationStatus.EXPIRED,
    ApplicationStatus.REJECTED,
  ]),
});

export const adminProgressSchema = z.object({
  hoursLogged: z.coerce.number().min(0).optional(),
  tasksCompleted: z.coerce.number().int().min(0).optional(),
});

export type AdminCreateJobInput = z.infer<typeof adminCreateJobSchema>;
export type AdminUpdateJobInput = z.infer<typeof adminUpdateJobSchema>;
export type AdminStatusInput = z.infer<typeof adminStatusSchema>;
export type AdminProgressInput = z.infer<typeof adminProgressSchema>;
