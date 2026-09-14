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
  .regex(/^\+\d{1,4}$/, "Use a phone country code like +1")
  .max(5);

const phoneNumber = z
  .string()
  .trim()
  .regex(/^[0-9 ()-]{7,24}$/, "Enter a valid phone number")
  .max(24);

const verificationCode = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "Enter the verification code");

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
    documentLast4: z.string().trim().regex(/^[A-Za-z0-9]{4}$/),
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
