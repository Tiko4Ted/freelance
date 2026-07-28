export type PayoutWebhookEvent = {
  providerPayoutId: string;
  status: "pending" | "paid" | "failed";
  failureReason?: string;
};

export type PayoutProvider = {
  createPayoutAccount(
    userId: string,
  ): Promise<{ providerAccountId: string; onboardingUrl?: string }>;
  isAccountReady(providerAccountId: string): Promise<boolean>;
  sendPayout(params: {
    providerAccountId: string;
    amount: number;
    currency: string;
    idempotencyKey: string;
  }): Promise<{ providerPayoutId: string; status: "pending" | "paid" | "failed" }>;
  handleWebhook(payload: unknown, signature: string): Promise<PayoutWebhookEvent>;
};
