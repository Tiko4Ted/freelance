"use client";

import { KycReviewStatus } from "@prisma/client";
import { useState } from "react";

export function KycReviewActions({
  userId,
  status,
}: {
  userId: string;
  status: KycReviewStatus;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function review(nextStatus: KycReviewStatus) {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/v1/admin/kyc/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, note: note || null }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "KYC review failed");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <label className="grid gap-2 text-xs font-semibold text-brand-ink">
        Review note
        <textarea
          className="min-h-20 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 py-2 text-sm font-normal outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional reason or audit note"
          value={note}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          disabled={busy}
          onClick={() => void review(KycReviewStatus.APPROVED)}
          type="button"
        >
          Approve KYC
        </button>
        <button
          className="h-10 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          disabled={busy}
          onClick={() => void review(KycReviewStatus.REJECTED)}
          type="button"
        >
          Reject KYC
        </button>
      </div>
      {message ? <p className="text-sm font-medium text-red-700">{message}</p> : null}
      <p className="text-xs text-brand-muted">Current review: {status.toLowerCase()}</p>
    </div>
  );
}
