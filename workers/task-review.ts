import { TaskReviewService } from "@/lib/services/task-review-service";

async function main() {
  const results = await TaskReviewService.runOnce();
  console.table(results.legacyApplications);
  console.table(results.projectTasks);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
