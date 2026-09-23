import { createRegisterPostHandler } from "@/lib/http/register-route-handler";
import { AuthService } from "@/lib/services/auth-service";
import { EmailVerificationService } from "@/lib/services/email-verification-service";

export const POST = createRegisterPostHandler({
  register: (input) => AuthService.register(input),
  sendWelcomeVerification: (user) =>
    EmailVerificationService.sendWelcomeVerification(user),
});
