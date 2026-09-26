import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export const PHONE_VERIFICATION_CODE_TTL_MS = 10 * 60 * 1_000;
export const PHONE_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1_000;
export const PHONE_VERIFICATION_SEND_WINDOW_MS = 60 * 60 * 1_000;
export const PHONE_VERIFICATION_MAX_SENDS_PER_WINDOW = 5;
export const PHONE_VERIFICATION_MAX_ATTEMPTS = 5;

export type PhoneVerificationErrorCode =
  | "PHONE_ALREADY_VERIFIED"
  | "PHONE_VERIFICATION_EXPIRED"
  | "PHONE_VERIFICATION_INVALID"
  | "PHONE_VERIFICATION_INVALID_PHONE"
  | "PHONE_VERIFICATION_NOT_CONFIGURED"
  | "PHONE_VERIFICATION_NOT_REQUESTED"
  | "PHONE_VERIFICATION_RATE_LIMITED"
  | "PHONE_VERIFICATION_SEND_FAILED"
  | "PHONE_VERIFICATION_TOO_MANY_ATTEMPTS";

export class PhoneVerificationError extends Error {
  readonly code: PhoneVerificationErrorCode;
  readonly remainingAttempts?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: PhoneVerificationErrorCode,
    options: {
      remainingAttempts?: number;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(code);
    this.name = "PhoneVerificationError";
    this.code = code;
    this.remainingAttempts = options.remainingAttempts;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export type NormalizedPhoneNumber = {
  countryCode: string;
  nationalNumber: string;
  e164: string;
};

export function normalizePhoneNumber(
  countryCodeInput: string,
  phoneNumberInput: string,
): NormalizedPhoneNumber {
  const countryCode = countryCodeInput.trim();
  const countryDigits = countryCode.replace(/\D/g, "");
  const nationalNumber = phoneNumberInput.replace(/\D/g, "").replace(/^0+/, "");
  const e164 = `+${countryDigits}${nationalNumber}`;

  if (
    !/^\+[1-9]\d{0,2}$/.test(countryCode) ||
    countryCode !== `+${countryDigits}` ||
    !nationalNumber ||
    !/^\+[1-9]\d{7,14}$/.test(e164)
  ) {
    throw new PhoneVerificationError("PHONE_VERIFICATION_INVALID_PHONE");
  }

  return { countryCode, nationalNumber, e164 };
}

export function generatePhoneVerificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashPhoneVerificationCode(input: {
  secret: string;
  userId: string;
  phoneNumber: string;
  code: string;
}): string {
  return createHmac("sha256", input.secret)
    .update(`${input.userId}:${input.phoneNumber}:${input.code}`, "utf8")
    .digest("hex");
}

export function phoneVerificationCodeMatches(input: {
  actualCode: string;
  expectedHash: string;
  phoneNumber: string;
  secret: string;
  userId: string;
}): boolean {
  const actualHash = hashPhoneVerificationCode({
    secret: input.secret,
    userId: input.userId,
    phoneNumber: input.phoneNumber,
    code: input.actualCode,
  });
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(input.expectedHash, "hex");

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getPhoneVerificationSecret(): string {
  const secret =
    process.env.PHONE_VERIFICATION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new PhoneVerificationError("PHONE_VERIFICATION_NOT_CONFIGURED");
  }

  return secret;
}
