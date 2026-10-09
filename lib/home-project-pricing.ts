import { PayoutTrigger } from "@prisma/client";

export const HOME_TASK_PAYOUT_MIN_CENTS = 5000;
export const HOME_TASK_PAYOUT_MAX_CENTS = 10000;

type HomeProjectPricingInput = {
  showOnHome: boolean;
  payoutType: string;
  payoutAmountCents: number;
};

export function homeProjectPricingError({
  showOnHome,
  payoutType,
  payoutAmountCents,
}: HomeProjectPricingInput) {
  if (!showOnHome) {
    return null;
  }

  if (payoutType !== PayoutTrigger.TASK_1) {
    return "Home projects must use per-task payout eligibility.";
  }

  if (
    payoutAmountCents < HOME_TASK_PAYOUT_MIN_CENTS ||
    payoutAmountCents > HOME_TASK_PAYOUT_MAX_CENTS
  ) {
    return "Home project payouts must be between $50 and $100 per task.";
  }

  return null;
}

export class HomeProjectPricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomeProjectPricingError";
  }
}
