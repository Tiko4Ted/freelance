"use client";

import { WalletTransferStatus } from "@prisma/client";
import { useState } from "react";

export function TransferReviewActions({ transferId }: { transferId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function review(status: WalletTransferStatus) {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/v1/admin/transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Transfer review failed");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="h-10 rounded-lg bg-brand-ink px-3 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] disabled:opacity-50"
          disabled={busy}
          onClick={() => void review(WalletTransferStatus.COMPLETED)}
          type="button"
        >
          Approve transfer
        </button>
        <button
          className="h-10 rounded-lg border border-red-300 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          disabled={busy}
          onClick={() => void review(WalletTransferStatus.FAILED)}
          type="button"
        >
          Reject and return funds
        </button>
      </div>
      {message ? <p className="text-sm font-medium text-red-700">{message}</p> : null}
    </div>
  );
}
