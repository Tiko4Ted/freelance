"use client";

import { ApplicationStatus } from "@prisma/client";
import { FormEvent, useState } from "react";

type ApplicationActionsProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
  hoursLogged: number;
  tasksCompleted: number;
};

const statuses = Object.values(ApplicationStatus);

export function ApplicationActions({
  applicationId,
  currentStatus,
  hoursLogged,
  tasksCompleted,
}: ApplicationActionsProps) {
  const [message, setMessage] = useState("");

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const status = String(formData.get("status") ?? currentStatus);
    const response = await fetch(
      `/api/v1/admin/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );

    setMessage(response.ok ? "Status updated" : "Status update failed");

    if (response.ok) {
      window.location.reload();
    }
  }

  async function updateProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch(
      `/api/v1/admin/applications/${applicationId}/hours`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoursLogged: Number(formData.get("hoursLogged") ?? hoursLogged),
          tasksCompleted: Number(
            formData.get("tasksCompleted") ?? tasksCompleted,
          ),
        }),
      },
    );

    setMessage(response.ok ? "Progress updated" : "Progress update failed");

    if (response.ok) {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={updateStatus}>
        <select
          className="h-10 min-w-40 rounded-lg border border-brand-sand bg-brand-canvas/50 px-2 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          defaultValue={currentStatus}
          name="status"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          className="h-10 rounded-lg bg-brand-ink px-3 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
          type="submit"
        >
          Save
        </button>
      </form>
      <form className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={updateProgress}>
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-2 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          defaultValue={hoursLogged}
          min={0}
          name="hoursLogged"
          step="0.5"
          type="number"
        />
        <input
          className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-2 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          defaultValue={tasksCompleted}
          min={0}
          name="tasksCompleted"
          step="1"
          type="number"
        />
        <button
          className="h-10 rounded-lg border border-brand-sand bg-brand-ivory px-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7] hover:text-brand-gold-strong"
          type="submit"
        >
          Log
        </button>
      </form>
      {message ? <p className="text-sm text-brand-gold-strong">{message}</p> : null}
    </div>
  );
}
