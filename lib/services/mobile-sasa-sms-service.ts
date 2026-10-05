import { PhoneVerificationError } from "@/lib/services/phone-verification";

export type MobileSasaConfig = {
  senderId: string;
  token: string;
};

type MobileSasaResponse = {
  message?: string;
  messageId?: string;
  responseCode?: string;
  status?: boolean;
};

const MOBILE_SASA_SEND_ENDPOINT = "https://api.mobilesasa.com/v2/send/message";

function getConfig(): MobileSasaConfig {
  const token = process.env.MOBILESASA_TOKEN?.trim();
  const senderId = process.env.MOBILESASA_SENDER_ID?.trim();

  if (!token || !senderId) {
    throw new PhoneVerificationError("PHONE_VERIFICATION_NOT_CONFIGURED");
  }

  return { senderId, token };
}

export function createMobileSasaSmsService(
  config: MobileSasaConfig,
  fetchImpl: typeof fetch = fetch,
) {
  return {
    async sendVerificationCode(input: {
      code: string;
      to: string;
      trackingId: string;
    }) {
      let response: Response;

      try {
        response = await fetchImpl(MOBILE_SASA_SEND_ENDPOINT, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Your Trinity-AI verification code is ${input.code}. It expires in 10 minutes. Do not share it.`,
            phone: input.to,
            senderID: config.senderId,
            trackingId: input.trackingId,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        throw new PhoneVerificationError("PHONE_VERIFICATION_SEND_FAILED");
      }

      let payload: MobileSasaResponse | null = null;
      try {
        payload = (await response.json()) as MobileSasaResponse;
      } catch {
        // A malformed provider response is treated as a failed send.
      }

      if (
        !response.ok ||
        payload?.status !== true ||
        payload.responseCode !== "0200" ||
        !payload.messageId
      ) {
        throw new PhoneVerificationError("PHONE_VERIFICATION_SEND_FAILED");
      }

      return { id: payload.messageId };
    },
  };
}

export const MobileSasaSmsService = {
  async sendVerificationCode(input: {
    code: string;
    to: string;
    trackingId: string;
  }) {
    return createMobileSasaSmsService(getConfig()).sendVerificationCode(input);
  },
};
