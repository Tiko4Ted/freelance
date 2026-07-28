import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthService } from "@/lib/services/auth-service";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = registerSchema.parse(body);
    const user = await AuthService.register(input);

    return NextResponse.json({ user }, { status: 201 });
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
}
