const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CLICKED: {
    label: "Link clicked",
    className: "bg-slate-100 text-slate-700",
  },
  APPLIED: {
    label: "Applied",
    className: "bg-slate-100 text-slate-700",
  },
  CERTIFYING: {
    label: "Certifying",
    className: "bg-amber-100 text-amber-800",
  },
  CERTIFIED: {
    label: "Certified",
    className: "bg-amber-100 text-amber-800",
  },
  MATCHED: {
    label: "Matched",
    className: "bg-blue-100 text-blue-800",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-blue-100 text-blue-800",
  },
  PAYOUT_ELIGIBLE: {
    label: "Payout eligible",
    className: "bg-teal-100 text-teal-800",
  },
  PAID: {
    label: "Paid",
    className: "bg-teal-100 text-teal-800",
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
    className: "bg-blue-100 text-blue-800",
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
