import { prisma } from "@/lib/db/prisma";
import {
  emailNotificationMessageSchema,
  phoneVerificationMessageSchema,
  type EmailNotificationMessage,
  type PhoneVerificationMessage,
} from "@/lib/queues/notification-queue";
import { AfricasTalkingSmsService } from "@/lib/services/africas-talking-sms-service";
import { EmailNotificationService } from "@/lib/services/email-notification-service";

const MAX_JOB_ATTEMPTS = 5;
const STALE_LOCK_MS = 4 * 60 * 1_000;

class PermanentNotificationError extends Error {}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 1_000)
    : "NOTIFICATION_DELIVERY_FAILED";
}

async function claimJob(jobId: string, kind: string) {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  const claimed = await prisma.notificationJob.updateMany({
    where: {
      id: jobId,
      kind,
      OR: [
        { status: "PENDING" },
        { status: "PROCESSING", lockedAt: { lt: staleBefore } },
      ],
    },
    data: {
      attempts: { increment: 1 },
      lastError: null,
      lockedAt: new Date(),
      status: "PROCESSING",
    },
  });

  if (claimed.count !== 1) {
    return null;
  }

  return prisma.notificationJob.findUnique({
    where: { id: jobId },
    select: { attempts: true },
  });
}

async function markJobFailed(jobId: string, reason: string) {
  await prisma.notificationJob.updateMany({
    where: { id: jobId, status: "PROCESSING" },
    data: {
      lastError: reason.slice(0, 1_000),
      lockedAt: null,
      status: "FAILED",
    },
  });
}

async function processClaimedJob(
  jobId: string,
  kind: string,
  deliver: () => Promise<{ id?: string | null } | void>,
) {
  const job = await claimJob(jobId, kind);

  if (!job) {
    return;
  }

  try {
    const result = await deliver();
    await prisma.notificationJob.updateMany({
      where: { id: jobId, status: "PROCESSING" },
      data: {
        lastError: null,
        lockedAt: null,
        providerMessageId: result?.id ?? null,
        sentAt: new Date(),
        status: "SENT",
      },
    });
  } catch (error) {
    const message = errorMessage(error);

    if (
      error instanceof PermanentNotificationError ||
      job.attempts >= MAX_JOB_ATTEMPTS
    ) {
      await markJobFailed(jobId, message);
      console.error("Notification job permanently failed", {
        error: message,
        jobId,
        kind,
      });
      return;
    }

    await prisma.notificationJob.updateMany({
      where: { id: jobId, status: "PROCESSING" },
      data: {
        lastError: message,
        lockedAt: null,
        status: "PENDING",
      },
    });
    throw error;
  }
}

async function welcomeVerificationIsCurrent(
  message: Extract<EmailNotificationMessage, { type: "welcome-verification" }>,
) {
  const token = await prisma.emailVerificationToken.findUnique({
    where: { userId: message.userId },
    select: { expiresAt: true, tokenHash: true },
  });

  return Boolean(
    token &&
      token.tokenHash === message.tokenHash &&
      token.expiresAt.getTime() > Date.now(),
  );
}

export async function processEmailNotificationMessage(payload: unknown) {
  const message = emailNotificationMessageSchema.parse(payload);

  await processClaimedJob(message.jobId, message.type, async () => {
    if (message.type === "welcome-verification") {
      if (!(await welcomeVerificationIsCurrent(message))) {
        throw new PermanentNotificationError("STALE_EMAIL_VERIFICATION_TOKEN");
      }

      return EmailNotificationService.sendQueuedWelcomeVerificationEmail(
        {
          name: message.name,
          to: message.to,
          verificationUrl: message.verificationUrl,
        },
        message.jobId,
      );
    }

    return EmailNotificationService.sendSignedLegalDocumentEmail(
      {
        document: message.document,
        name: message.name,
        signedAt: message.signedAt,
        signerName: message.signerName,
        signerTitle: message.signerTitle,
        signatureText: message.signatureText,
        to: message.to,
      },
      message.jobId,
    );
  });
}

async function phoneChallengeIsCurrent(message: PhoneVerificationMessage) {
  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId: message.userId },
    select: {
      phoneVerificationCodeHash: true,
      phoneVerificationExpiresAt: true,
    },
  });

  return Boolean(
    onboarding?.phoneVerificationCodeHash === message.codeHash &&
      onboarding.phoneVerificationExpiresAt &&
      onboarding.phoneVerificationExpiresAt.getTime() > Date.now() &&
      new Date(message.expiresAt).getTime() > Date.now(),
  );
}

export async function processPhoneVerificationMessage(payload: unknown) {
  const message = phoneVerificationMessageSchema.parse(payload);

  await processClaimedJob(message.jobId, message.type, async () => {
    if (!(await phoneChallengeIsCurrent(message))) {
      throw new PermanentNotificationError(
        "STALE_PHONE_VERIFICATION_CHALLENGE",
      );
    }

    await AfricasTalkingSmsService.sendVerificationCode({
      code: message.code,
      to: message.to,
    });
  });
}
