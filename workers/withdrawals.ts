import { WithdrawalService } from "@/lib/services/withdrawal-service";

async function main() {
  const results = await WithdrawalService.processPending();
  console.table(results);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
