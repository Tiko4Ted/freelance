import {
  ApplicationStatus,
  KycReviewStatus,
  PayoutTrigger,
  WalletTransferStatus,
} from "@prisma/client";
import { z } from "zod";

import { homeProjectPricingError } from "@/lib/home-project-pricing";
import { aptitudeTestDefinitionSchema } from "@/lib/aptitude-test";

const adminJobFields = {
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(4000),
  payoutAmountCents: z.coerce.number().int().positive(),
  payoutType: z
    .enum([PayoutTrigger.HOURS_10, PayoutTrigger.TASK_1])
    .default(PayoutTrigger.HOURS_10),
  currency: z.string().trim().length(3).default("USD"),
  companyName: z.string().trim().min(2).max(120).default("Trinity-AI"),
  openings: z.coerce.number().int().positive().default(1),
  hourlyMinCents: z.coerce.number().int().positive().nullable().optional(),
  hourlyMaxCents: z.coerce.number().int().positive().nullable().optional(),
  postedAt: z.coerce.date().optional(),
  isHighDemand: z.boolean().optional().default(false),
  showOnHome: z.boolean().optional().default(false),
  // Every project must use the AI-data task structure. Keep this as a literal
  // so future admin writes cannot silently create a legacy task format.
  isAiTask: z.literal(true).optional().default(true),
  aptitudeTest: aptitudeTestDefinitionSchema.optional(),
  skills: z.array(z.string().trim().min(1).max(80)).optional().default([]),
  isActive: z.boolean().optional().default(true),
};

function withHomeProjectPricingValidation<
  T extends z.ZodRawShape,
>(schema: z.ZodObject<T>) {
  return schema.superRefine((input, context) => {
    if (!input.showOnHome) {
      return;
    }

    const pricingError = homeProjectPricingError({
      showOnHome: true,
      payoutType: input.payoutType ?? PayoutTrigger.HOURS_10,
      payoutAmountCents: input.payoutAmountCents ?? 0,
    });
    if (pricingError) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["showOnHome"],
        message: pricingError,
      });
    }
  });
}

export const adminCreateJobSchema = withHomeProjectPricingValidation(
  z.object(adminJobFields),
);

export const adminUpdateJobSchema = withHomeProjectPricingValidation(
  z.object(adminJobFields).partial(),
);

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
    ApplicationStatus.CLOSED,
  ]),
});

export const adminProgressSchema = z.object({
  hoursLogged: z.coerce.number().min(0).optional(),
  tasksCompleted: z.coerce.number().int().min(0).optional(),
});

export const adminKycReviewSchema = z.object({
  status: z.nativeEnum(KycReviewStatus),
  note: z.string().trim().max(2_000).nullable().optional(),
});

export const adminWalletTransferReviewSchema = z.object({
  status: z.enum([WalletTransferStatus.COMPLETED, WalletTransferStatus.FAILED]),
});

export const adminBulkOperationSchema = z.object({
  sourceStatus: z.nativeEnum(ApplicationStatus).nullable().optional(),
  targetStatus: z.nativeEnum(ApplicationStatus),
  jobId: z.string().uuid().nullable().optional(),
  olderThanHours: z.coerce.number().int().min(0).max(24 * 365).nullable().optional(),
  maxItems: z.coerce.number().int().min(1).max(500).default(100),
  delayHours: z.coerce.number().int().min(0).max(24 * 7).default(0),
});

export const adminEmailTestSchema = z.object({
  to: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
});

export type AdminCreateJobInput = z.infer<typeof adminCreateJobSchema>;
export type AdminUpdateJobInput = z.infer<typeof adminUpdateJobSchema>;
export type AdminStatusInput = z.infer<typeof adminStatusSchema>;
export type AdminProgressInput = z.infer<typeof adminProgressSchema>;
export type AdminKycReviewInput = z.infer<typeof adminKycReviewSchema>;
export type AdminWalletTransferReviewInput = z.infer<
  typeof adminWalletTransferReviewSchema
>;
export type AdminBulkOperationInput = z.infer<typeof adminBulkOperationSchema>;
export type AdminEmailTestInput = z.infer<typeof adminEmailTestSchema>;
