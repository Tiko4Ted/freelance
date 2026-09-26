import assert from "node:assert/strict";
import test from "node:test";

import { ApplicationService } from "../lib/services/application-service";
import {
  OnboardingService,
  type OnboardingStatus,
} from "../lib/services/onboarding-service";

const pendingReviewStatus = {
  complete: false,
  requirementsComplete: true,
  reviewPending: true,
} as OnboardingStatus;

test("task material stays locked while onboarding review is pending", async () => {
  const originalGetStatus = OnboardingService.getStatus;
  OnboardingService.getStatus = async () => pendingReviewStatus;

  try {
    await assert.rejects(
      ApplicationService.getTaskMaterial("application-1", "user-1"),
      /APPLICATION_NOT_FOUND/,
    );
  } finally {
    OnboardingService.getStatus = originalGetStatus;
  }
});

test("task submission stays locked while onboarding review is pending", async () => {
  const originalGetStatus = OnboardingService.getStatus;
  OnboardingService.getStatus = async () => pendingReviewStatus;

  try {
    await assert.rejects(
      ApplicationService.submitTask("application-1", "user-1", {
        fileName: "completed-work.pdf",
        notes: "Finished the assigned review.",
      }),
      /TASK_NOT_SUBMITTABLE/,
    );
  } finally {
    OnboardingService.getStatus = originalGetStatus;
  }
});
