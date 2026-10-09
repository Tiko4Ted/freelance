import { notFound } from "next/navigation";

import {
  HomeAnnotationWorkspace,
  type AnnotationCriterion,
  type AnnotationModelOutput,
} from "@/components/home-annotation-workspace";
import { requirePageSession } from "@/lib/auth/session";
import {
  AnnotationService,
  AnnotationServiceError,
} from "@/lib/services/annotation-service";

type PageProps = { params: Promise<{ jobId: string }> };

export default async function HomeProjectTaskPage({ params }: PageProps) {
  const { jobId } = await params;
  const session = await requirePageSession(`/home/projects/${jobId}/task`);
  let assignment;

  try {
    assignment = await AnnotationService.getOrCreateAssignment(
      jobId,
      session.user.id,
    );
  } catch (error) {
    if (
      error instanceof AnnotationServiceError &&
      error.code === "NO_ANNOTATION_TASKS_AVAILABLE"
    ) {
      return (
        <main className="mx-auto max-w-3xl px-5 py-12 md:px-10">
          <div className="rounded-[24px] border border-brand-sand bg-brand-ivory p-8 shadow-brand-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">Queue status</p>
            <h1 className="mt-3 text-3xl font-semibold text-brand-ink">No tasks are available right now.</h1>
            <p className="mt-3 text-sm leading-6 text-brand-muted">This project has no unassigned evaluation tasks. Check back after the operations team adds the next batch.</p>
          </div>
        </main>
      );
    }
    notFound();
  }

  return (
    <HomeAnnotationWorkspace
      assignmentId={assignment.assignmentId}
      expiresAt={assignment.expiresAt.toISOString()}
      task={{
        ...assignment.task,
        constraints: Array.isArray(assignment.task.constraints)
          ? (assignment.task.constraints as Array<{ type: string; value: string }>)
          : null,
        modelOutputs: assignment.task.modelOutputs as Record<string, AnnotationModelOutput>,
        project: {
          ...assignment.task.project,
          rubricSchema: (assignment.task.project.rubricSchema ?? {}) as {
            criteria?: AnnotationCriterion[];
          },
        },
      }}
    />
  );
}
