import { cookies } from "next/headers";

import { createRegisterPostHandler } from "@/lib/http/register-route-handler";
import {
  getReferralCodeFromCookie,
  REFERRAL_ATTRIBUTION_COOKIE_NAME,
  REFERRAL_COOKIE_NAME,
} from "@/lib/referral-cookie";
import { AuthService } from "@/lib/services/auth-service";
import { EmailVerificationService } from "@/lib/services/email-verification-service";

export const POST = createRegisterPostHandler({
  register: (input) => AuthService.register(input),
  async readReferralCookie() {
    const cookieStore = await cookies();
    const attributionCookie = cookieStore.get(
      REFERRAL_ATTRIBUTION_COOKIE_NAME,
    )?.value;
    const jobReferralCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;

    return (
      getReferralCodeFromCookie(attributionCookie) ??
      getReferralCodeFromCookie(jobReferralCookie)
    );
  },
  sendWelcomeVerification: (user, callbackUrl) =>
    EmailVerificationService.sendWelcomeVerification(user, callbackUrl),
});
