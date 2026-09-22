import { requireSession } from "@/lib/auth/session";
import { createWithdrawalHandlers } from "@/lib/http/withdrawal-route-handler";
import { WithdrawalService } from "@/lib/services/withdrawal-service";

const handlers = createWithdrawalHandlers({
  requireSession,
  listWithdrawals: WithdrawalService.listWithdrawals,
  requestWithdrawal: WithdrawalService.requestWithdrawal,
});

export function GET() {
  return handlers.GET();
}

export function POST(request: Request) {
  return handlers.POST(request);
}
