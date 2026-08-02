import { z } from "zod";

export const walletTransferSchema = z.object({
  amountCents: z.coerce.number().int().positive(),
  freelanceIdCode: z.string().trim().min(2).max(80).optional(),
  serialNumber: z.string().trim().min(2).max(80).optional(),
  legalName: z.string().trim().min(1).max(160).optional(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional(),
});

export type WalletTransferInput = z.infer<typeof walletTransferSchema>;
