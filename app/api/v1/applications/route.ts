import { cookies } from "next/headers";

import { requireSession } from "@/lib/auth/session";
import { createApplicationPostHandler } from "@/lib/http/application-route-handler";
import { ApplicationService } from "@/lib/services/application-service";

const REFERRAL_COOKIE_NAME = "ref_code";

const handlePost = createApplicationPostHandler({
  requireSession,
  async readReferralCookie() {
    const cookieStore = await cookies();
    return cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  },
  submitApplication: ApplicationService.submitApplication,
});

export function POST(request: Request) {
  return handlePost(request);
}
