import { z } from "zod";

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

export const freelanceIdentitySyncSchema = z.object({
  idempotencyKey: z.string().trim().min(12).max(160),
  freelanceIdCode: z.string().trim().min(2).max(80),
  serialNumber: z.string().trim().min(2).max(80),
  legalName: z.string().trim().min(1).max(160),
  dateOfBirth: dateOnly,
  isActive: z.boolean(),
});

export const freelanceIdentityVerificationSchema = z.object({
  freelanceIdCode: z.string().trim().min(2).max(80),
  serialNumber: z.string().trim().min(2).max(80),
  legalName: z.string().trim().min(1).max(160),
  dateOfBirth: dateOnly,
});

export type FreelanceIdentitySyncInput = z.infer<
  typeof freelanceIdentitySyncSchema
>;

export type FreelanceIdentityVerificationInput = z.infer<
  typeof freelanceIdentityVerificationSchema
>;
