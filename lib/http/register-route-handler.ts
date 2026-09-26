import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

type RegisteredUser = {
  id: string;
  email: string;
  name: string;
};

type RegisterDependencies = {
  register: (input: RegisterInput) => Promise<RegisteredUser>;
  sendWelcomeVerification: (user: RegisteredUser) => Promise<unknown>;
};

export function createRegisterPostHandler(dependencies: RegisterDependencies) {
  return async function POST(request: Request) {
    try {
      const body: unknown = await request.json();
      const input = registerSchema.parse(body);
      const user = await dependencies.register(input);
      let verificationEmailSent = false;

      try {
        await dependencies.sendWelcomeVerification(user);
        verificationEmailSent = true;
      } catch (error) {
        console.error("Welcome verification email failed", {
          error,
          userId: user.id,
        });
      }

      return NextResponse.json(
        { verificationEmailSent },
        {
          status: 201,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid registration input", issues: error.flatten() },
          { status: 400 },
        );
      }

      if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Unable to register user" },
        { status: 500 },
      );
    }
  };
}
