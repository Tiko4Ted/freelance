import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireSession } from "@/lib/auth/session";
import { ApplicationService } from "@/lib/services/application-service";
import { applicationSchema } from "@/lib/validation/application";

const REFERRAL_COOKIE_NAME = "ref_code";

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    if (!session.user.email) {
      return NextResponse.json(
        { error: "Account email is required to apply" },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const input = applicationSchema.parse(body);
    const cookieStore = await cookies();
    const referralCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    const application = await ApplicationService.submitApplication(
      input,
      { id: session.user.id, email: session.user.email },
      referralCookie,
    );

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Sign in before applying to this job" },
        { status: 401 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid application input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "SELF_REFERRAL") {
      return NextResponse.json(
        { error: "Self-referrals are not eligible" },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "APPLICATION_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        { error: "Candidate has already applied to this job" },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("ACTIVE_APPLICATION:")
    ) {
      const activeJobTitle = error.message.split(":").slice(1).join(":");

      return NextResponse.json(
        {
          error: `Complete and submit your current task before applying to another job: ${activeJobTitle}`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to submit application" },
      { status: 500 },
    );
  }
}
