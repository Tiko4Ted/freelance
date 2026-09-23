import { NextResponse } from "next/server";
import { z } from "zod";

import type { EmailVerificationResult } from "@/lib/services/email-verification-service";

const verifyEmailSchema = z.object({
  token: z.string().min(32).max(256),
});

type VerifyEmailDependencies = {
  verifyToken: (token: string) => Promise<EmailVerificationResult>;
};

export function createVerifyEmailPostHandler(
  dependencies: VerifyEmailDependencies,
) {
  return async function POST(request: Request) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid verification link" }, { status: 400 });
    }

    const result = await dependencies.verifyToken(parsed.data.token);
    if (result === "expired") {
      return NextResponse.json(
        { error: "Verification link has expired" },
        { status: 410 },
      );
    }

    if (result === "invalid") {
      return NextResponse.json(
        { error: "Verification link is invalid or has already been used" },
        { status: 400 },
      );
    }

    return NextResponse.json({ verified: true });
  };
}
