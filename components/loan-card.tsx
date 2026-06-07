import Link from "next/link";
import type { LoanView } from "@/lib/loans";
import { StatusPill } from "@/components/status-pill";
import { Avatar } from "@/components/avatar";
import { Money } from "@/components/money";
import { CardDeleteButton } from "@/components/card-delete-button";
import { COUNTDOWN_TONE_CLASS, dueCountdown } from "@/lib/format";
import { TERMINAL_STATUSES } from "@/lib/status";

export function LoanCard({ loan }: { loan: LoanView }) {
  const cd = dueCountdown(loan.due_date);
  const terminal = TERMINAL_STATUSES.includes(loan.status);
  const verb = loan.role === "lender" ? "Lent to" : "Borrowed from";

  return (
    <div className="group/card relative">
      <Link
        href={`/loans/${loan.id}`}
        className="block rounded-2xl border border-warm-200 bg-card p-4 transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out-quint)] hover:border-brand-line hover:shadow-[0_10px_28px_-14px_rgba(36,58,138,0.30)] focus-ring"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={loan.counterpartyName} />
            <div className="min-w-0">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-warm-400">
                {verb}
              </p>
              <p className="truncate font-semibold text-ink">
                {loan.counterpartyName}
              </p>
            </div>
          </div>
          {/* reserve the very corner for the delete button on deletable cards */}
          <div className={terminal ? "pr-8" : undefined}>
            <StatusPill status={loan.status} />
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Money
              amount={loan.amount}
              className="text-lg font-semibold tracking-tight text-ink"
            />
            <p className="mt-0.5 truncate text-sm text-warm-500">
              {loan.reason}
            </p>
          </div>
          {!terminal && (
            <span
              className={`shrink-0 text-xs font-semibold ${COUNTDOWN_TONE_CLASS[cd.tone]}`}
            >
              {cd.label}
            </span>
          )}
        </div>
      </Link>
      {terminal && (
        <CardDeleteButton loanId={loan.id} name={loan.counterpartyName} />
      )}
    </div>
  );
}
