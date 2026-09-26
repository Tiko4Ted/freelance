import { processEmailNotificationMessage } from "@/lib/services/notification-worker-service";

export async function POST(request: Request) {
  const { handleCallback } = await import("@vercel/queue");
  const handler = handleCallback(processEmailNotificationMessage, {
    retry: (_error, metadata) => ({
      afterSeconds: Math.min(300, 5 * 2 ** Math.min(metadata.deliveryCount, 6)),
    }),
    visibilityTimeoutSeconds: 300,
  });

  return handler(request);
}
