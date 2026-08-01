import { z } from "zod";

export const walletTransferSchema = z.object({
  amountCents: z.coerce.number().int().positive(),
  freelanceIdCode: z.string().trim().min(2).max(80).optional(),
  serialNumber: z.string().trim().min(2).max(80).optional(),
});

export type WalletTransferInput = z.infer<typeof walletTransferSchema>;
