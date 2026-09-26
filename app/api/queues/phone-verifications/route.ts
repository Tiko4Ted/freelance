import { processPhoneVerificationMessage } from "@/lib/services/notification-worker-service";

export async function POST(request: Request) {
  const { handleCallback } = await import("@vercel/queue");
  const handler = handleCallback(processPhoneVerificationMessage, {
    retry: (_error, metadata) => ({
      afterSeconds: Math.min(60, 5 * 2 ** Math.min(metadata.deliveryCount, 4)),
    }),
    visibilityTimeoutSeconds: 300,
  });

  return handler(request);
}
