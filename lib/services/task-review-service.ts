import { AdminApplicationService } from "@/lib/services/admin-application-service";
import { ProjectTaskService } from "@/lib/services/project-task-service";

export const TaskReviewService = {
  async runOnce(now = new Date()) {
    const [legacyApplications, projectTasks] = await Promise.all([
      AdminApplicationService.autoApproveDueTaskSubmissions(now),
      ProjectTaskService.autoReviewDueSubmissions(now),
    ]);

    return {
      legacyApplications,
      projectTasks,
      totalApproved:
        legacyApplications.filter((item) => item.result === "APPROVED").length +
        projectTasks.filter((item) => item.result === "APPROVED").length,
    };
  },
};
