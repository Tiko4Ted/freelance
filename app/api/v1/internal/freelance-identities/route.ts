import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { FreelanceIdentitySyncService } from "@/lib/services/freelance-identity-sync-service";
import { freelanceIdentitySyncSchema } from "@/lib/validation/freelance-identity";

export async function POST(request: Request) {
  if (!isAuthorized(request.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const input = freelanceIdentitySyncSchema.parse(body);
    const result = await FreelanceIdentitySyncService.syncIdentity(input);

    if (result.status === "conflict") {
      return NextResponse.json(
        { error: result.reason },
        { status: result.statusCode },
      );
    }

    return NextResponse.json(
      { id: result.id, status: result.status },
      { status: result.statusCode },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid identity payload", issues: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Freelance identity sync failed", error);

    return NextResponse.json(
      { error: "Unable to sync identity" },
      { status: 500 },
    );
  }
}

function isAuthorized(headers: Headers): boolean {
  const expectedToken = process.env.ID_GENERATOR_SYNC_BEARER_TOKEN;

  if (!expectedToken) {
    return false;
  }

  const authorization = headers.get("authorization");
  return authorization === `Bearer ${expectedToken}`;
}
