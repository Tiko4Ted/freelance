import assert from "node:assert/strict";
import test from "node:test";

import {
  ONBOARDING_REVIEW_DELAY_MS,
  isOnboardingReviewApproved,
  onboardingReviewAvailableAt,
} from "../lib/onboarding-review";

test("onboarding review unlocks exactly 15 minutes after submission", () => {
  const submittedAt = new Date("2026-09-26T12:00:00.000Z");
  const availableAt = onboardingReviewAvailableAt(submittedAt);

  assert.equal(
    availableAt?.toISOString(),
    "2026-09-26T12:15:00.000Z",
  );
  assert.equal(
    isOnboardingReviewApproved(
      submittedAt,
      new Date(submittedAt.getTime() + ONBOARDING_REVIEW_DELAY_MS - 1),
    ),
    false,
  );
  assert.equal(
    isOnboardingReviewApproved(submittedAt, availableAt ?? new Date(0)),
    true,
  );
});

test("onboarding review stays locked without a submission timestamp", () => {
  assert.equal(isOnboardingReviewApproved(null), false);
  assert.equal(onboardingReviewAvailableAt(null), null);
});
