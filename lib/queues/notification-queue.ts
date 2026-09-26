import type { SendOptions, SendResult } from "@vercel/queue";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { ONBOARDING_REVIEW_DELAY_SECONDS } from "@/lib/onboarding-review";

export const EMAIL_NOTIFICATION_TOPIC = "email-notifications";
export const PHONE_VERIFICATION_TOPIC = "phone-verifications";

const jobEnvelopeSchema = z.object({
  jobId: z.string().uuid(),
});

export const emailNotificationMessageSchema = z.discriminatedUnion("type", [
  jobEnvelopeSchema.extend({
    type: z.literal("welcome-verification"),
    userId: z.string().uuid(),
    tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
    name: z.string().max(200),
    to: z.string().email(),
    verificationUrl: z.string().url(),
  }),
  jobEnvelopeSchema.extend({
    type: z.literal("signed-legal-document"),
    document: z.enum(["nda", "dataSubmission"]),
    name: z.string().max(200),
    signedAt: z.string().datetime(),
    signerName: z.string().max(200),
    signerTitle: z.string().max(200),
    signatureText: z.string().max(200),
    to: z.string().email(),
  }),
  jobEnvelopeSchema.extend({
    type: z.literal("onboarding-review"),
    userId: z.string().uuid(),
    submittedAt: z.string().datetime(),
  }),
]);

export const phoneVerificationMessageSchema = jobEnvelopeSchema.extend({
  type: z.literal("phone-verification"),
  userId: z.string().uuid(),
  to: z.string().regex(/^\+[1-9]\d{7,14}$/),
  code: z.string().regex(/^\d{6}$/),
  codeHash: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.string().datetime(),
});

export type EmailNotificationMessage = z.infer<
  typeof emailNotificationMessageSchema
>;
export type PhoneVerificationMessage = z.infer<
  typeof phoneVerificationMessageSchema
>;

type QueueSend = <T>(
  topicName: string,
  payload: T,
  options?: SendOptions,
) => Promise<SendResult>;

const sendWithVercelQueue: QueueSend = async (topicName, payload, options) => {
  const { send } = await import("@vercel/queue");
  return send(topicName, payload, options);
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1_000) : "QUEUE_PUBLISH_FAILED";
}

export function createNotificationQueue(
  sendMessage: QueueSend = sendWithVercelQueue,
) {
  async function enqueue<T extends { jobId: string }>(input: {
    delaySeconds?: number;
    kind: string;
    payload: Omit<T, "jobId">;
    retentionSeconds: number;
    topic: string;
  }) {
    const job = await prisma.notificationJob.create({
      data: { kind: input.kind },
      select: { id: true },
    });

    try {
      const result = await sendMessage(
        input.topic,
        { ...input.payload, jobId: job.id } as T,
        {
          ...(input.delaySeconds
            ? { delaySeconds: input.delaySeconds }
            : {}),
          idempotencyKey: job.id,
          retentionSeconds: input.retentionSeconds,
        },
      );

      return { jobId: job.id, messageId: result.messageId };
    } catch (error) {
      await prisma.notificationJob.updateMany({
        where: { id: job.id, status: "PENDING" },
        data: { status: "FAILED", lastError: errorMessage(error) },
      });
      throw error;
    }
  }

  return {
    enqueueWelcomeVerification(
      input: Omit<
        Extract<EmailNotificationMessage, { type: "welcome-verification" }>,
        "jobId"
      >,
    ) {
      return enqueue<EmailNotificationMessage>({
        kind: input.type,
        payload: input,
        retentionSeconds: 86_400,
        topic: EMAIL_NOTIFICATION_TOPIC,
      });
    },

    enqueueSignedLegalDocument(
      input: Omit<
        Extract<EmailNotificationMessage, { type: "signed-legal-document" }>,
        "jobId"
      >,
    ) {
      return enqueue<EmailNotificationMessage>({
        kind: input.type,
        payload: input,
        retentionSeconds: 86_400,
        topic: EMAIL_NOTIFICATION_TOPIC,
      });
    },

    enqueueOnboardingReview(
      input: Omit<
        Extract<EmailNotificationMessage, { type: "onboarding-review" }>,
        "jobId"
      >,
    ) {
      return enqueue<EmailNotificationMessage>({
        delaySeconds: ONBOARDING_REVIEW_DELAY_SECONDS,
        kind: input.type,
        payload: input,
        retentionSeconds: 86_400,
        topic: EMAIL_NOTIFICATION_TOPIC,
      });
    },

    enqueuePhoneVerification(
      input: Omit<PhoneVerificationMessage, "jobId">,
    ) {
      return enqueue<PhoneVerificationMessage>({
        kind: input.type,
        payload: input,
        retentionSeconds: 600,
        topic: PHONE_VERIFICATION_TOPIC,
      });
    },
  };
}

export const NotificationQueue = createNotificationQueue();
