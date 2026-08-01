import { z } from "zod";

export const walletTransferSchema = z.object({
  amountCents: z.coerce.number().int().positive(),
  freelanceIdCode: z.string().trim().min(2).max(80).optional(),
  legalName: z.string().trim().min(2).max(160).optional(),
  dateOfBirth: z.string().trim().min(8).max(20).optional(),
});

export type WalletTransferInput = z.infer<typeof walletTransferSchema>;
