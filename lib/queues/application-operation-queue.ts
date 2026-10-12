import { z } from "zod";

export const APPLICATION_OPERATION_TOPIC = "application-bulk-operations";

const applicationOperationMessageSchema = z.object({
  operationId: z.string().uuid(),
});

export type ApplicationOperationMessage = z.infer<
  typeof applicationOperationMessageSchema
>;

export async function enqueueApplicationBulkOperation(
  operationId: string,
  delaySeconds: number,
) {
  const { send } = await import("@vercel/queue");

  return send<ApplicationOperationMessage>(
    APPLICATION_OPERATION_TOPIC,
    { operationId },
    {
      delaySeconds,
      idempotencyKey: operationId,
      retentionSeconds: 7 * 24 * 60 * 60,
    },
  );
}

export function parseApplicationOperationMessage(payload: unknown) {
  return applicationOperationMessageSchema.parse(payload);
}
