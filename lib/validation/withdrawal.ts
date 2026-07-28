import { z } from "zod";

export const withdrawalRequestSchema = z.object({
  amountCents: z.coerce.number().int().positive(),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
