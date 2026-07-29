import { NextRequest, NextResponse } from "next/server";

const REFERRAL_COOKIE_NAME = "ref_code";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

function getJobIdFromPath(pathname: string) {
  const match = /^\/jobs\/([^/]+)(?:\/apply)?$/.exec(pathname);
  return match?.[1] ?? null;
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const referralCode =
    request.nextUrl.searchParams.get("ref") ??
    request.nextUrl.searchParams.get("referralCode");
  const jobId = getJobIdFromPath(request.nextUrl.pathname);
  const existingReferral = request.cookies.get(REFERRAL_COOKIE_NAME);

  if (referralCode && jobId && !existingReferral) {
    response.cookies.set({
      name: REFERRAL_COOKIE_NAME,
      value: `${jobId}:${referralCode}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: THIRTY_DAYS_SECONDS,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/jobs/:path*"],
};
