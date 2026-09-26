import assert from "node:assert/strict";
import test from "node:test";

import { onboardingActionSchema } from "../lib/validation/onboarding";

const identitySubmission = {
  action: "verifyIdentity" as const,
  legalName: "Ada Lovelace",
  dateOfBirth: "1990-12-10",
  documentType: "national_id" as const,
  documentFrontSelected: true as const,
  documentBackSelected: true as const,
};

test("identity verification requires confirmation for both document sides", () => {
  assert.equal(onboardingActionSchema.safeParse(identitySubmission).success, true);

  assert.equal(
    onboardingActionSchema.safeParse({
      ...identitySubmission,
      documentBackSelected: false,
    }).success,
    false,
  );

  assert.equal(
    onboardingActionSchema.safeParse({
      action: "verifyIdentity",
      legalName: "Ada Lovelace",
      dateOfBirth: "1990-12-10",
      documentType: "national_id",
      documentBackSelected: true,
    }).success,
    false,
  );
});

test("legacy last-four identity submissions cannot bypass document selection", () => {
  assert.equal(
    onboardingActionSchema.safeParse({
      action: "verifyIdentity",
      legalName: "Ada Lovelace",
      dateOfBirth: "1990-12-10",
      documentType: "national_id",
      documentLast4: "1234",
    }).success,
    false,
  );
});
