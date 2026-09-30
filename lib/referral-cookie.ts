export const REFERRAL_COOKIE_NAME = "ref_code";
export const REFERRAL_ATTRIBUTION_COOKIE_NAME = "referral_attribution";
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

export function getReferralAttributionCookieValue(input: {
  referralCode: string | null;
  existingCookieValue?: string;
}) {
  if (input.existingCookieValue || !input.referralCode) {
    return null;
  }

  return input.referralCode;
}

export function getReferralCodeFromCookie(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const separatorIndex = value.indexOf(":");
  const referralCode = separatorIndex === -1
    ? value
    : value.slice(separatorIndex + 1);

  return referralCode || undefined;
}
