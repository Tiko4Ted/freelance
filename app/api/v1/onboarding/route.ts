import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { UnauthorizedError, requireSession } from "@/lib/auth/session";
import { OnboardingService } from "@/lib/services/onboarding-service";
import { PhoneVerificationError } from "@/lib/services/phone-verification";
import { onboardingActionSchema } from "@/lib/validation/onboarding";

function phoneVerificationErrorResponse(error: PhoneVerificationError) {
  const details =
    error.remainingAttempts === undefined
      ? {}
      : { remainingAttempts: error.remainingAttempts };

  switch (error.code) {
    case "PHONE_ALREADY_VERIFIED":
      return NextResponse.json(
        { error: "This phone number is already verified" },
        { status: 409 },
      );
    case "PHONE_VERIFICATION_INVALID_PHONE":
      return NextResponse.json(
        { error: "Enter a valid phone number in international format" },
        { status: 400 },
      );
    case "PHONE_VERIFICATION_NOT_REQUESTED":
      return NextResponse.json(
        { error: "Request a verification code first" },
        { status: 409 },
      );
    case "PHONE_VERIFICATION_EXPIRED":
      return NextResponse.json(
        { error: "The verification code expired. Request a new code" },
        { status: 410 },
      );
    case "PHONE_VERIFICATION_INVALID":
      return NextResponse.json(
        { error: "The verification code is incorrect", ...details },
        { status: 400 },
      );
    case "PHONE_VERIFICATION_TOO_MANY_ATTEMPTS":
      return NextResponse.json(
        {
          error: "Too many incorrect attempts. Request a new code",
          ...details,
        },
        { status: 429 },
      );
    case "PHONE_VERIFICATION_RATE_LIMITED": {
      const retryAfterSeconds = error.retryAfterSeconds ?? 60;
      return NextResponse.json(
        {
          error: `Please wait ${retryAfterSeconds} seconds before requesting another code`,
          retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }
    case "PHONE_VERIFICATION_NOT_CONFIGURED":
      return NextResponse.json(
        { error: "Phone verification is temporarily unavailable" },
        { status: 503 },
      );
    case "PHONE_VERIFICATION_SEND_FAILED":
      return NextResponse.json(
        { error: "Unable to send the verification code. Try again later" },
        { status: 502 },
      );
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const onboarding = await OnboardingService.getStatus(session.user.id);

    return NextResponse.json({ onboarding });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Unable to load onboarding" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const input = onboardingActionSchema.parse(body);

    const onboarding =
      input.action === "signLegal"
        ? await OnboardingService.signLegal(session.user.id, input)
        : input.action === "requestPhoneVerification"
          ? await OnboardingService.requestPhoneVerification(
              session.user.id,
              input,
            )
          : input.action === "verifyPhone"
            ? await OnboardingService.verifyPhone(session.user.id, input)
            : input.action === "verifyIdentity"
              ? await OnboardingService.verifyIdentity(session.user.id, input)
              : await OnboardingService.setupPayments(session.user.id, input);

    return NextResponse.json({ onboarding });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid onboarding input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof PhoneVerificationError) {
      return phoneVerificationErrorResponse(error);
    }

    return NextResponse.json(
      { error: "Unable to update onboarding" },
      { status: 500 },
    );
  }
}
