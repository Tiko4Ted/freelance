export type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export function requestContextFromHeaders(headers: Headers): RequestContext {
  const forwardedFor = headers.get("x-forwarded-for");

  return {
    ipAddress:
      forwardedFor?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      null,
    userAgent: headers.get("user-agent"),
  };
}
