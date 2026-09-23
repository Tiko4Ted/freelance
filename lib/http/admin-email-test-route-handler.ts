import { NextResponse } from "next/server";

import { ForbiddenError, UnauthorizedError } from "@/lib/auth/session";
import { adminEmailTestSchema } from "@/lib/validation/admin";

type AdminSession = {
  user: {
    id: string;
  };
};

type EmailDelivery = {
  id: string | null;
  status: "sent";
};

type AdminEmailTestDependencies = {
  requireAdmin: () => Promise<AdminSession>;
  sendTestEmail: (to: string) => Promise<EmailDelivery>;
};

const responseInit = {
  headers: { "Cache-Control": "no-store" },
};

export function createAdminEmailTestPostHandler(
  dependencies: AdminEmailTestDependencies,
) {
  return async function POST(request: Request) {
    let session: AdminSession;

    try {
      session = await dependencies.requireAdmin();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { ...responseInit, status: 401 },
        );
      }

      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          { error: "Forbidden" },
          { ...responseInit, status: 403 },
        );
      }

      console.error("Unable to authorize admin email test", error);
      return NextResponse.json(
        { error: "Unable to authorize request" },
        { ...responseInit, status: 500 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { ...responseInit, status: 400 },
      );
    }

    const parsed = adminEmailTestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email test input", issues: parsed.error.flatten() },
        { ...responseInit, status: 400 },
      );
    }

    try {
      const delivery = await dependencies.sendTestEmail(parsed.data.to);
      console.info("Admin email delivery test accepted", {
        adminUserId: session.user.id,
        deliveryId: delivery.id,
        recipient: parsed.data.to,
      });

      return NextResponse.json(
        {
          accepted: true,
          deliveryId: delivery.id,
          to: parsed.data.to,
        },
        responseInit,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "EMAIL_PROVIDER_NOT_CONFIGURED"
      ) {
        return NextResponse.json(
          { error: "Email provider is not configured" },
          { ...responseInit, status: 503 },
        );
      }

      console.error("Admin email delivery test failed", {
        adminUserId: session.user.id,
        error,
        recipient: parsed.data.to,
      });
      return NextResponse.json(
        { error: "Email provider rejected the test message" },
        { ...responseInit, status: 502 },
      );
    }
  };
}
