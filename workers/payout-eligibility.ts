import { PayoutEligibilityService } from "@/lib/services/payout-eligibility-service";

async function main() {
  const results = await PayoutEligibilityService.runOnce();
  console.table(results);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
