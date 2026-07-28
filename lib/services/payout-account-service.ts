import { prisma } from "@/lib/db/prisma";
import { getPayoutProvider } from "@/lib/payments";

export const PayoutAccountService = {
  async startOnboarding(userId: string) {
    const provider = getPayoutProvider("mock");
    const account = await provider.createPayoutAccount(userId);
    const isReady = await provider.isAccountReady(account.providerAccountId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        payoutProvider: "mock",
        payoutAccountId: account.providerAccountId,
        payoutAccountReady: isReady,
      },
      select: {
        payoutProvider: true,
        payoutAccountId: true,
        payoutAccountReady: true,
      },
    });

    return {
      ...user,
      onboardingUrl: account.onboardingUrl ?? null,
    };
  },

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        payoutProvider: true,
        payoutAccountId: true,
        payoutAccountReady: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return user;
  },
};
