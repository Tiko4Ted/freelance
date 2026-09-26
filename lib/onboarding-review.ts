export const ONBOARDING_REVIEW_DELAY_SECONDS = 15 * 60;
export const ONBOARDING_REVIEW_DELAY_MS =
  ONBOARDING_REVIEW_DELAY_SECONDS * 1_000;

export function onboardingReviewAvailableAt(
  submittedAt: Date | null | undefined,
) {
  return submittedAt
    ? new Date(submittedAt.getTime() + ONBOARDING_REVIEW_DELAY_MS)
    : null;
}

export function isOnboardingReviewApproved(
  submittedAt: Date | null | undefined,
  now = new Date(),
) {
  const availableAt = onboardingReviewAvailableAt(submittedAt);
  return Boolean(availableAt && availableAt.getTime() <= now.getTime());
}
