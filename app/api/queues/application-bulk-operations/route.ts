import { processApplicationOperationMessage } from "@/lib/services/admin-bulk-operation-service";

export async function POST(request: Request) {
  const { handleCallback } = await import("@vercel/queue");
  const handler = handleCallback(processApplicationOperationMessage, {
    retry: (_error, metadata) => ({
      afterSeconds: Math.min(300, 5 * 2 ** Math.min(metadata.deliveryCount, 6)),
    }),
    visibilityTimeoutSeconds: 300,
  });

  return handler(request);
}
