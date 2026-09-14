import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { UnauthorizedError, requireSession } from "@/lib/auth/session";
import { OnboardingService } from "@/lib/services/onboarding-service";
import { onboardingActionSchema } from "@/lib/validation/onboarding";

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

    return NextResponse.json(
      { error: "Unable to update onboarding" },
      { status: 500 },
    );
  }
}
