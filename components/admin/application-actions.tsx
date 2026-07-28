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
          className="h-10 min-w-40 border border-slate-300 px-2 text-sm outline-none focus:border-teal-700"
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
          className="h-10 border border-slate-950 bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-teal-700"
          type="submit"
        >
          Save
        </button>
      </form>
      <form className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={updateProgress}>
        <input
          className="h-10 border border-slate-300 px-2 text-sm outline-none focus:border-teal-700"
          defaultValue={hoursLogged}
          min={0}
          name="hoursLogged"
          step="0.5"
          type="number"
        />
        <input
          className="h-10 border border-slate-300 px-2 text-sm outline-none focus:border-teal-700"
          defaultValue={tasksCompleted}
          min={0}
          name="tasksCompleted"
          step="1"
          type="number"
        />
        <button
          className="h-10 border border-slate-950 px-3 text-sm font-semibold text-slate-950 hover:border-teal-700 hover:text-teal-700"
          type="submit"
        >
          Log
        </button>
      </form>
      {message ? <p className="text-sm text-teal-700">{message}</p> : null}
    </div>
  );
}
