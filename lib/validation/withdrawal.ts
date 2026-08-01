import { z } from "zod";

export const payoutMethodSchema = z.enum([
  "MPESA",
  "AIRTEL_MONEY",
  "BANK_CARD",
  "BINANCE",
  "PAYPAL",
]);

export const withdrawalRequestSchema = z.object({
  amountCents: z.coerce.number().int().positive(),
  payoutMethod: payoutMethodSchema,
  destinationDetails: z.string().trim().min(2).max(160),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type PayoutMethodInput = z.infer<typeof payoutMethodSchema>;
