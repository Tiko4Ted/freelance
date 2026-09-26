import { PhoneVerificationError } from "@/lib/services/phone-verification";

type AfricasTalkingConfig = {
  apiKey: string;
  environment: "production" | "sandbox";
  senderId: string;
  username: string;
};

type AfricasTalkingRecipient = {
  number?: string;
  statusCode?: number;
};

type AfricasTalkingResponse = {
  SMSMessageData?: {
    Recipients?: AfricasTalkingRecipient[];
  };
};

const ACCEPTED_STATUS_CODES = new Set([100, 101, 102]);

function getConfig(): AfricasTalkingConfig {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY?.trim();
  const username = process.env.AFRICAS_TALKING_USERNAME?.trim();
  const senderId = process.env.AFRICAS_TALKING_SENDER_ID?.trim();
  const environmentValue =
    process.env.AFRICAS_TALKING_ENVIRONMENT?.trim().toLowerCase() ||
    "production";

  if (
    !apiKey ||
    !username ||
    !senderId ||
    (environmentValue !== "production" && environmentValue !== "sandbox")
  ) {
    throw new PhoneVerificationError("PHONE_VERIFICATION_NOT_CONFIGURED");
  }

  return {
    apiKey,
    username,
    senderId,
    environment: environmentValue,
  };
}

function endpointFor(environment: AfricasTalkingConfig["environment"]) {
  return environment === "sandbox"
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";
}

export function createAfricasTalkingSmsService(
  config: AfricasTalkingConfig,
  fetchImpl: typeof fetch = fetch,
) {
  return {
    async sendVerificationCode(input: { code: string; to: string }) {
      const body = new URLSearchParams({
        username: config.username,
        to: input.to,
        message: `Your Trinity-AI verification code is ${input.code}. It expires in 10 minutes. Do not share it.`,
        from: config.senderId,
        bulkSMSMode: "1",
      });

      let response: Response;

      try {
        response = await fetchImpl(endpointFor(config.environment), {
          method: "POST",
          headers: {
            Accept: "application/json",
            apiKey: config.apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new PhoneVerificationError("PHONE_VERIFICATION_SEND_FAILED");
      }

      let payload: AfricasTalkingResponse | null = null;
      try {
        payload = (await response.json()) as AfricasTalkingResponse;
      } catch {
        // A malformed provider response is treated as a failed send.
      }

      const recipients = payload?.SMSMessageData?.Recipients;
      const recipient =
        recipients?.length === 1 && recipients[0]?.number === input.to
          ? recipients[0]
          : undefined;
      if (
        response.status !== 201 ||
        !recipient?.statusCode ||
        !ACCEPTED_STATUS_CODES.has(recipient.statusCode)
      ) {
        throw new PhoneVerificationError("PHONE_VERIFICATION_SEND_FAILED");
      }
    },
  };
}

export const AfricasTalkingSmsService = {
  async sendVerificationCode(input: { code: string; to: string }) {
    return createAfricasTalkingSmsService(getConfig()).sendVerificationCode(input);
  },
};
