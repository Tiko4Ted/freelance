import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db/prisma";
import { EmailNotificationService } from "@/lib/services/email-notification-service";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const DEFAULT_APP_URL = "https://freelance-nu-swart.vercel.app";

type VerificationUser = {
  id: string;
  email: string;
  name: string;
};

export type EmailVerificationResult = "verified" | "expired" | "invalid";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    DEFAULT_APP_URL
  ).replace(/\/$/, "");
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildEmailVerificationUrl(token: string) {
  return `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export const EmailVerificationService = {
  async sendWelcomeVerification(user: VerificationUser) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashEmailVerificationToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt, createdAt: new Date() },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    try {
      return await EmailNotificationService.sendWelcomeVerificationEmail({
        name: user.name,
        to: user.email,
        verificationUrl: buildEmailVerificationUrl(token),
      });
    } catch (error) {
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id, tokenHash },
      });
      throw error;
    }
  },

  async verifyToken(token: string): Promise<EmailVerificationResult> {
    if (!TOKEN_PATTERN.test(token)) {
      return "invalid";
    }

    const tokenHash = hashEmailVerificationToken(token);
    const now = new Date();

    return prisma.$transaction(async (transaction) => {
      const record = await transaction.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: { expiresAt: true, userId: true },
      });

      if (!record) {
        return "invalid";
      }

      if (record.expiresAt <= now) {
        await transaction.emailVerificationToken.deleteMany({
          where: { tokenHash },
        });
        return "expired";
      }

      const consumed = await transaction.emailVerificationToken.deleteMany({
        where: { tokenHash, expiresAt: { gt: now } },
      });

      if (consumed.count !== 1) {
        return "invalid";
      }

      await transaction.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: now },
      });

      return "verified";
    });
  },
};
