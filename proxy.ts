import { NextRequest, NextResponse } from "next/server";

import {
  getReferralCookieValue,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from "@/lib/referral-cookie";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const referralCode =
    request.nextUrl.searchParams.get("ref") ??
    request.nextUrl.searchParams.get("referralCode");
  const existingReferral = request.cookies.get(REFERRAL_COOKIE_NAME);
  const cookieValue = getReferralCookieValue({
    pathname: request.nextUrl.pathname,
    referralCode,
    existingCookieValue: existingReferral?.value,
  });

  if (cookieValue) {
    response.cookies.set({
      name: REFERRAL_COOKIE_NAME,
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/jobs/:path*", "/referral/jobs/:path*", "/apply/:path*"],
};
