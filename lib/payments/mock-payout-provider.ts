import type { PayoutProvider, PayoutWebhookEvent } from "@/lib/payments/payout-provider";

export const mockPayoutProvider: PayoutProvider = {
  async createPayoutAccount(userId) {
    return {
      providerAccountId: `mock_acct_${userId}`,
    };
  },

  async isAccountReady() {
    return true;
  },

  async sendPayout(params) {
    return {
      providerPayoutId: `mock_po_${params.idempotencyKey}`,
      status: "paid",
    };
  },

  async handleWebhook(): Promise<PayoutWebhookEvent> {
    throw new Error("MOCK_PROVIDER_DOES_NOT_USE_WEBHOOKS");
  },
};
