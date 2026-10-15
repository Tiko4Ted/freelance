"use client";

import { useState } from "react";

export function ProjectTaskSubmissionActions({ assignmentId }: { assignmentId: string }) {
  const [busy, setBusy] = useState(false);
  async function review(decision: "approve" | "reject") {
    setBusy(true);
    await fetch(`/api/v1/admin/project-task-assignments/${assignmentId}/${decision}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    window.location.reload();
  }
  return <div className="flex flex-wrap gap-2"><button className="h-9 rounded-[10px] bg-brand-ink px-3 text-xs font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => review("approve")} type="button">Approve and hold payment</button><button className="h-9 rounded-[10px] border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50" disabled={busy} onClick={() => review("reject")} type="button">Reject</button></div>;
}
