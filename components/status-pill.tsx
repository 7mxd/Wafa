import { STATUS_META, type LoanStatus } from "@/lib/status";

export function StatusPill({ status }: { status: LoanStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight ring-1 ring-inset ${meta.pill}`}
    >
      {meta.label}
    </span>
  );
}
