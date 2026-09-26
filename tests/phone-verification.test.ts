import assert from "node:assert/strict";
import test from "node:test";

import { createAfricasTalkingSmsService } from "../lib/services/africas-talking-sms-service";
import {
  PhoneVerificationError,
  generatePhoneVerificationCode,
  hashPhoneVerificationCode,
  normalizePhoneNumber,
  phoneVerificationCodeMatches,
} from "../lib/services/phone-verification";
import { onboardingActionSchema } from "../lib/validation/onboarding";

test("normalizes a national phone number to E.164", () => {
  assert.deepEqual(normalizePhoneNumber("+254", "0712 345-678"), {
    countryCode: "+254",
    nationalNumber: "712345678",
    e164: "+254712345678",
  });

  assert.throws(
    () => normalizePhoneNumber("254", "0712345678"),
    (error: unknown) =>
      error instanceof PhoneVerificationError &&
      error.code === "PHONE_VERIFICATION_INVALID_PHONE",
  );
});

test("generates six-digit verification codes including leading-zero values", () => {
  for (let index = 0; index < 25; index += 1) {
    assert.match(generatePhoneVerificationCode(), /^\d{6}$/);
  }
});

test("accepts only the exact code bound to the same user and phone", () => {
  const challenge = {
    secret: "unit-test-verification-secret",
    userId: "user-1",
    phoneNumber: "+254712345678",
    code: "004281",
  };
  const expectedHash = hashPhoneVerificationCode(challenge);

  assert.equal(
    phoneVerificationCodeMatches({
      actualCode: challenge.code,
      expectedHash,
      phoneNumber: challenge.phoneNumber,
      secret: challenge.secret,
      userId: challenge.userId,
    }),
    true,
  );
  assert.equal(
    phoneVerificationCodeMatches({
      actualCode: "004282",
      expectedHash,
      phoneNumber: challenge.phoneNumber,
      secret: challenge.secret,
      userId: challenge.userId,
    }),
    false,
  );
  assert.equal(
    phoneVerificationCodeMatches({
      actualCode: challenge.code,
      expectedHash,
      phoneNumber: "+254700000000",
      secret: challenge.secret,
      userId: challenge.userId,
    }),
    false,
  );
});

test("onboarding validation requires exactly six OTP digits", () => {
  const base = {
    action: "verifyPhone",
    phoneCountryCode: "+254",
    phoneNumber: "712345678",
  };

  assert.equal(
    onboardingActionSchema.safeParse({
      ...base,
      verificationCode: "123456",
    }).success,
    true,
  );
  assert.equal(
    onboardingActionSchema.safeParse({
      ...base,
      verificationCode: "12345",
    }).success,
    false,
  );
  assert.equal(
    onboardingActionSchema.safeParse({
      ...base,
      verificationCode: "1234567",
    }).success,
    false,
  );
});

test("sends the OTP through the Africa's Talking production messaging API", async () => {
  let requestUrl = "";
  let requestBody = "";
  let requestHeaders: Headers | undefined;
  const fakeFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    requestBody = String(init?.body);
    requestHeaders = new Headers(init?.headers);
    return new Response(
      JSON.stringify({
        SMSMessageData: {
          Recipients: [
            {
              number: "+254712345678",
              statusCode: 101,
              status: "Success",
            },
          ],
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
  const service = createAfricasTalkingSmsService(
    {
      apiKey: "test-api-key",
      environment: "production",
      senderId: "AFTKNG",
      username: "test-user",
    },
    fakeFetch,
  );

  await service.sendVerificationCode({
    code: "381204",
    to: "+254712345678",
  });

  const fields = new URLSearchParams(requestBody);
  assert.equal(
    requestUrl,
    "https://api.africastalking.com/version1/messaging",
  );
  assert.equal(fields.get("username"), "test-user");
  assert.equal(fields.get("to"), "+254712345678");
  assert.equal(fields.get("from"), "AFTKNG");
  assert.equal(fields.get("bulkSMSMode"), "1");
  assert.match(fields.get("message") ?? "", /381204/);
  assert.equal(requestHeaders?.get("apikey"), "test-api-key");
});

test("rejects an OTP send when Africa's Talking does not accept the recipient", async () => {
  const fakeFetch = (async () =>
    new Response(
      JSON.stringify({
        SMSMessageData: {
          Recipients: [
            {
              number: "+254712345678",
              statusCode: 402,
              status: "InvalidSenderId",
            },
          ],
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;
  const service = createAfricasTalkingSmsService(
    {
      apiKey: "test-api-key",
      environment: "production",
      senderId: "AFTKNG",
      username: "test-user",
    },
    fakeFetch,
  );

  await assert.rejects(
    () =>
      service.sendVerificationCode({
        code: "381204",
        to: "+254712345678",
      }),
    (error: unknown) =>
      error instanceof PhoneVerificationError &&
      error.code === "PHONE_VERIFICATION_SEND_FAILED",
  );
});
