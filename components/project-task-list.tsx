"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Circle, Download, LockKeyhole, Upload } from "lucide-react";

export type DashboardTask = {
  id: string;
  title: string;
  description: string;
  payoutLabel: string;
  status: string;
  assignmentId?: string;
  assignmentStatus?: string;
  submittedFileName?: string | null;
  briefHref?: string;
  canClaim?: boolean;
  canSubmit?: boolean;
};

export function ProjectTaskList({ tasks }: { tasks: DashboardTask[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function claim(taskId: string) {
    setBusyId(taskId);
    setError(null);
    const response = await fetch(`/api/v1/project-tasks/${taskId}/claim`, { method: "POST" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "This task cannot be started yet.");
    } else {
      router.refresh();
    }
    setBusyId(null);
  }

  async function submit(task: DashboardTask, file: File | null) {
    if (!file || !task.assignmentId) return;
    setBusyId(task.id);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`/api/v1/project-task-assignments/${task.assignmentId}/submission`, { method: "POST", body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "The submission could not be uploaded.");
    } else {
      router.refresh();
    }
    setBusyId(null);
  }

  return (
    <div className="mt-5 border-t border-brand-sand/70 pt-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold-strong">Task queue</p>
          <h4 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-brand-ink">Choose one task at a time</h4>
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-brand-muted">Submit your current task before starting another. A submitted task can remain under review while you continue.</p>
      </div>
      <div className="divide-y divide-brand-sand/70 border-y border-brand-sand/70">
        {tasks.map((task, index) => {
          const submitted = task.assignmentStatus === "SUBMITTED" || task.assignmentStatus === "APPROVED" || task.assignmentStatus === "PAID";
          const active = task.assignmentStatus === "IN_PROGRESS";
          const closed = task.status !== "OPEN";
          return (
            <div
              className={`grid gap-3 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                submitted
                  ? "bg-emerald-50/40"
                  : active
                    ? "bg-[var(--color-accent-soft)]/30"
                    : ""
              }`}
              key={task.id}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${submitted ? "border-emerald-300 bg-emerald-50 text-emerald-700" : active ? "border-brand-gold bg-[var(--color-accent-soft)] text-brand-gold-strong" : "border-brand-sand text-brand-muted"}`}>
                {submitted ? <Check className="h-4 w-4" /> : closed ? <LockKeyhole className="h-3.5 w-3.5" /> : active ? <Circle className="h-3.5 w-3.5 fill-current" /> : String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h5 className="font-semibold text-brand-ink">{task.title}</h5>
                  <span className="text-xs font-semibold text-emerald-800">{task.payoutLabel}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-brand-muted">{task.description}</p>
                {submitted ? <p className="mt-1 text-xs font-semibold text-emerald-700">Submitted and awaiting review{task.submittedFileName ? `. ${task.submittedFileName}` : ""}</p> : active ? <p className="mt-1 text-xs font-semibold text-brand-gold-strong">In progress. Finish and upload this task to continue.</p> : closed ? <p className="mt-1 text-xs font-semibold text-brand-muted">Closed by the project team.</p> : null}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {task.briefHref ? <a className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-brand-sand px-3 text-xs font-semibold text-brand-ink hover:border-brand-gold/60 hover:bg-[var(--color-accent-soft)]" download href={task.briefHref}><Download className="h-3.5 w-3.5" />Brief</a> : null}
                {task.canClaim ? <button className="h-9 rounded-[10px] bg-brand-ink px-3 text-xs font-semibold text-brand-ivory hover:bg-brand-gold-strong disabled:opacity-50" disabled={busyId === task.id} onClick={() => claim(task.id)} type="button">{busyId === task.id ? "Starting..." : "Start task"}</button> : null}
                {task.canSubmit ? <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"><Upload className="h-3.5 w-3.5" />{busyId === task.id ? "Uploading..." : "Upload answer"}<input className="sr-only" type="file" accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip,.png,.jpg,.jpeg" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.currentTarget.value = ""; void submit(task, file); }} /></label> : null}
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
