export const REFERRAL_COOKIE_NAME = "ref_code";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getJobIdFromReferralPath(pathname: string) {
  const match = /^\/jobs\/([^/]+)(?:\/apply)?\/?$/.exec(pathname);
  return match?.[1] ?? null;
}

export function getReferralCookieValue(input: {
  pathname: string;
  referralCode: string | null;
  existingCookieValue?: string;
}) {
  if (input.existingCookieValue || !input.referralCode) {
    return null;
  }

  const jobId = getJobIdFromReferralPath(input.pathname);
  return jobId ? `${jobId}:${input.referralCode}` : null;
}
