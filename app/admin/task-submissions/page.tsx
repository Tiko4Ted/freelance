import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { ProjectTaskSubmissionActions } from "@/components/admin/project-task-submission-actions";
import { ProjectTaskService } from "@/lib/services/project-task-service";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminTaskSubmissionsPage() {
  try { await requireRole(Role.ADMIN); } catch { redirect("/login?callbackUrl=/admin/task-submissions"); }
  const assignments = await ProjectTaskService.listAssignments();
  return <main className="min-h-screen bg-brand-canvas px-5 pb-12 pt-28 text-brand-ink lg:pl-72 lg:pr-10"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-strong">Review queue</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Task submissions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted">Approve or reject child-task submissions independently. Approval moves the task price into the contributor holding balance.</p></div><span className="rounded-full border border-brand-sand bg-brand-ivory px-3 py-1.5 text-xs font-semibold">{assignments.length} awaiting action</span></div><div className="mt-8 divide-y divide-brand-sand border-y border-brand-sand bg-brand-ivory">{assignments.length ? assignments.map((assignment) => <article className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]" key={assignment.id}><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-semibold text-brand-gold-strong">{assignment.status}</span><span className="text-xs text-brand-muted">{assignment.task.project.title}</span></div><h2 className="mt-3 text-lg font-semibold">{assignment.task.title}</h2><p className="mt-1 text-sm text-brand-muted">{assignment.application.candidateName} · {assignment.application.candidateEmail}</p><p className="mt-3 text-sm leading-6 text-brand-ink">{assignment.submissionFileName ?? "Submission file unavailable"}{assignment.submissionNotes ? ` · ${assignment.submissionNotes}` : ""}</p></div><div className="flex items-center gap-4 lg:flex-col lg:items-end lg:justify-center"><span className="text-sm font-semibold text-brand-gold-strong">${(assignment.task.payoutAmountCents / 100).toFixed(0)}</span><ProjectTaskSubmissionActions assignmentId={assignment.id} /></div></article>) : <div className="p-10 text-center text-sm text-brand-muted">No task submissions are waiting for review.</div>}</div></div></main>;
}
