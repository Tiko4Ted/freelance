const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CLICKED: {
    label: "Link clicked",
    className: "bg-slate-100 text-slate-700",
  },
  APPLIED: {
    label: "Pending approval",
    className: "bg-amber-100 text-amber-800",
  },
  CERTIFYING: {
    label: "Pending task review",
    className: "bg-amber-100 text-amber-800",
  },
  CERTIFIED: {
    label: "Approved",
    className: "bg-[#f2e8d7] text-brand-gold-strong",
  },
  MATCHED: {
    label: "Matched",
    className: "bg-[#f2e8d7] text-brand-gold-strong",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-[#f2e8d7] text-brand-gold-strong",
  },
  PAYOUT_ELIGIBLE: {
    label: "Payout eligible",
    className: "bg-emerald-100 text-emerald-800",
  },
  PAID: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-800",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-200 text-slate-600",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-[#f2e8d7] text-brand-gold-strong",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800",
  },
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
