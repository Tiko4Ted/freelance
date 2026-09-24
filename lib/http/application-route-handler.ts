import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApplicationInput } from "@/lib/validation/application";
import { applicationSchema } from "@/lib/validation/application";

type ApplicationSession = {
  user: {
    id: string;
    email?: string | null;
  };
};

type ApplicationRouteDependencies = {
  requireSession: () => Promise<ApplicationSession>;
  readReferralCookie: () => Promise<string | undefined>;
  submitApplication: (
    input: ApplicationInput,
    applicant: { id: string; email: string },
    referralCookie?: string,
  ) => Promise<unknown>;
};

export function createApplicationPostHandler(
  dependencies: ApplicationRouteDependencies,
) {
  return async function handleApplicationPost(request: Request) {
    try {
      const session = await dependencies.requireSession();

      if (!session.user.email) {
        return NextResponse.json(
          { error: "Account email is required to apply" },
          { status: 400 },
        );
      }

      const body: unknown = await request.json();
      const input = applicationSchema.parse(body);
      const referralCookie = await dependencies.readReferralCookie();
      const application = await dependencies.submitApplication(
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

      if (error instanceof Error && error.message === "PROJECT_FULL") {
        return NextResponse.json(
          { error: "This project has reached its participant limit" },
          { status: 409 },
        );
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
            error: `You already have an active application for ${activeJobTitle}. Open your home page, finish and submit that task, then apply to another job.`,
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Unable to submit application" },
        { status: 500 },
      );
    }
  };
}
