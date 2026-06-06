import Link from "next/link";
import type { LoanView } from "@/lib/loans";
import { StatusPill } from "@/components/status-pill";
import { COUNTDOWN_TONE_CLASS, dueCountdown, formatAed } from "@/lib/format";
import { TERMINAL_STATUSES } from "@/lib/status";

export function LoanCard({ loan }: { loan: LoanView }) {
  const cd = dueCountdown(loan.due_date);
  const showCountdown = !TERMINAL_STATUSES.includes(loan.status);
  const verb = loan.role === "lender" ? "Lent to" : "Borrowed from";

  return (
    <Link
      href={`/loans/${loan.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-stone-400">{verb}</p>
          <p className="truncate font-medium text-stone-900">
            {loan.counterpartyName}
          </p>
        </div>
        <StatusPill status={loan.status} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-stone-900">
            {formatAed(loan.amount)}
          </p>
          <p className="mt-0.5 truncate text-sm text-stone-500">{loan.reason}</p>
        </div>
        {showCountdown && (
          <span
            className={`shrink-0 text-xs font-medium ${COUNTDOWN_TONE_CLASS[cd.tone]}`}
          >
            {cd.label}
          </span>
        )}
      </div>
    </Link>
  );
}
