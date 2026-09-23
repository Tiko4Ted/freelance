import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { createAdminEmailTestPostHandler } from "@/lib/http/admin-email-test-route-handler";
import { EmailNotificationService } from "@/lib/services/email-notification-service";

export const POST = createAdminEmailTestPostHandler({
  requireAdmin: () => requireRole(Role.ADMIN),
  sendTestEmail: (to) => EmailNotificationService.sendTestEmail(to),
});
