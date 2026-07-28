import { prisma } from "@/lib/db/prisma";

function formatCurrency(amountCents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export const LedgerService = {
  async getWallet(userId: string) {
    const [user, ledgerEntries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          walletBalanceCents: true,
        },
      }),
      prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountCents: true,
          reason: true,
          applicationId: true,
          withdrawalId: true,
          createdAt: true,
        },
      }),
    ]);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const reconciledBalanceCents = ledgerEntries.reduce(
      (total, entry) => total + entry.amountCents,
      0,
    );

    return {
      balanceCents: user.walletBalanceCents,
      reconciledBalanceCents,
      formattedBalance: formatCurrency(user.walletBalanceCents),
      ledgerEntries: ledgerEntries.map((entry) => ({
        ...entry,
        formattedAmount: formatCurrency(entry.amountCents),
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  },
};
