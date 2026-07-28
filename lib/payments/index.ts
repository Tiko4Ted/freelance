import { mockPayoutProvider } from "@/lib/payments/mock-payout-provider";

export function getPayoutProvider(providerName: string | null | undefined) {
  if (!providerName || providerName === "mock") {
    return mockPayoutProvider;
  }

  throw new Error(`Unsupported payout provider: ${providerName}`);
}
