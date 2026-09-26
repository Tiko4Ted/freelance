import { z } from "zod";

const signedDocumentSchema = z.enum(["nda", "dataSubmission"]);

const signatureFields = z.object({
  signerName: z.string().trim().min(1).max(160),
  signerTitle: z.string().trim().min(1).max(120),
  signatureText: z.string().trim().min(1).max(160),
});

const phoneCountryCode = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{0,2}$/, "Use a phone country code like +254")
  .max(4);

const phoneNumber = z
  .string()
  .trim()
  .regex(/^[0-9 ()-]{7,24}$/, "Enter a valid phone number")
  .max(24);

const verificationCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the six-digit verification code");

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

export const onboardingActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("signLegal"),
      document: signedDocumentSchema,
    })
    .merge(signatureFields),
  z.object({
    action: z.literal("requestPhoneVerification"),
    phoneCountryCode,
    phoneNumber,
  }),
  z.object({
    action: z.literal("verifyPhone"),
    phoneCountryCode,
    phoneNumber,
    verificationCode,
  }),
  z.object({
    action: z.literal("verifyIdentity"),
    legalName: z.string().trim().min(1).max(160),
    dateOfBirth: dateOnly,
    documentType: z.enum(["national_id", "passport", "drivers_license"]),
    documentFrontSelected: z.literal(true),
    documentBackSelected: z.literal(true),
  }),
  z.object({
    action: z.literal("setupPayments"),
    paymentMethod: z.enum([
      "MPESA",
      "AIRTEL_MONEY",
      "BANK_CARD",
      "BINANCE",
      "PAYPAL",
    ]),
    paymentDestination: z.string().trim().min(2).max(160),
  }),
]);

export type OnboardingActionInput = z.infer<typeof onboardingActionSchema>;
