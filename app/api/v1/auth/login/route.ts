import { AuthError } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validation/auth";

function normalizeSignInResult(result: unknown) {
  if (typeof result === "string") {
    return { redirectTo: result };
  }

  if (
    result &&
    typeof result === "object" &&
    "url" in result &&
    typeof result.url === "string"
  ) {
    return { redirectTo: result.url };
  }

  return { redirectTo: null };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = loginSchema.parse(body);
    const result: unknown = await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });

    return NextResponse.json({
      ok: true,
      ...normalizeSignInResult(result),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid login input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    return NextResponse.json({ error: "Unable to log in" }, { status: 500 });
  }
}
