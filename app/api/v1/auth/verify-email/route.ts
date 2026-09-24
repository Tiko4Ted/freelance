import { createVerifyEmailPostHandler } from "@/lib/http/verify-email-route-handler";
import { EmailVerificationService } from "@/lib/services/email-verification-service";

export const POST = createVerifyEmailPostHandler({
  verifyToken: (token) => EmailVerificationService.verifyToken(token),
});
