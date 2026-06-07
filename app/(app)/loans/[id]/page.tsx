import { notFound } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getLoan, getLoanEvents } from "@/lib/loans";
import { StatusPill } from "@/components/status-pill";
import { InterestFreeBadge } from "@/components/interest-free-badge";
import { LoanActions } from "@/components/loan-actions";
import { AuditTimeline } from "@/components/audit-timeline";
import { Avatar } from "@/components/avatar";
import { Money } from "@/components/money";
import { BackLink } from "@/components/back-link";
import {
  formatAed,
  formatDate,
  dueCountdown,
  COUNTDOWN_TONE_CLASS,
} from "@/lib/format";
import { STATUS_META, TERMINAL_STATUSES } from "@/lib/status";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  const [loan, events] = await Promise.all([
    getLoan(supabase, user!.id, id),
    getLoanEvents(supabase, id),
  ]);
  if (!loan) notFound();

  let lenderIban: string | null = null;
  if (
    loan.role === "borrower" &&
    (loan.status === "active" || loan.status === "repaid_pending")
  ) {
    const { data } = await supabase.rpc("get_lender_iban", { p_loan_id: id });
    lenderIban = (data as string | null) ?? null;
  }

  const verb = loan.role === "lender" ? "Lent to" : "Borrowed from";
  const cd = dueCountdown(loan.due_date);
  const showCountdown = !TERMINAL_STATUSES.includes(loan.status);

  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <BackLink />

      <div className="mt-4 overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-[0_12px_36px_-22px_rgba(36,58,138,0.28)]">
        <div className="flex items-start justify-between gap-3 border-b border-warm-100 bg-gradient-to-br from-brand-tint/60 via-transparent to-transparent p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={loan.counterpartyName} size={44} />
            <div className="min-w-0">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-warm-400">
                {verb}
              </p>
              <h1 className="truncate text-lg font-bold text-ink">
                {loan.counterpartyName}
              </h1>
            </div>
          </div>
          <StatusPill status={loan.status} />
        </div>

        <div className="p-5 sm:p-6">
          <Money
            amount={loan.amount}
            className="text-[2.5rem] font-bold leading-none tracking-tight text-ink"
          />
          <p className="mt-3 text-sm text-warm-600">{loan.reason}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {loan.due_date && (
              <span className="inline-flex items-center gap-1.5 text-warm-500">
                <CalendarIcon />
                {showCountdown ? (
                  <>
                    <span
                      className={`font-semibold ${COUNTDOWN_TONE_CLASS[cd.tone]}`}
                    >
                      {cd.label}
                    </span>
                    <span className="text-warm-400">
                      · {formatDate(loan.due_date)}
                    </span>
                  </>
                ) : (
                  <>Due {formatDate(loan.due_date)}</>
                )}
              </span>
            )}
            <InterestFreeBadge />
          </div>

          <p className="mt-3 text-xs text-warm-400">
            {STATUS_META[loan.status].blurb}
          </p>

          {loan.status === "countered" && loan.counter_amount != null && (
            <div className="mt-4 rounded-xl border border-coral-line bg-coral-tint/55 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-coral-strong">
                Counter-offer
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink">
                <span className="font-mono text-warm-400 line-through">
                  {formatAed(loan.amount)}
                </span>
                <ArrowRightIcon />
                <span className="font-mono font-semibold text-ink">
                  {formatAed(loan.counter_amount)}
                </span>
                {loan.counter_due_date && (
                  <span className="text-warm-500">
                    · due {formatDate(loan.counter_due_date)}
                  </span>
                )}
              </p>
              {loan.counter_note && (
                <p className="mt-1.5 text-sm text-warm-600">
                  “{loan.counter_note}”
                </p>
              )}
            </div>
          )}

          {loan.ai_summary && (
            <p className="mt-4 rounded-xl border border-warm-200 bg-paper px-3.5 py-2.5 text-xs leading-relaxed text-warm-500">
              {loan.ai_summary}
            </p>
          )}

          <div className="mt-5 border-t border-warm-100 pt-5">
            <LoanActions loan={loan} lenderIban={lenderIban} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-warm-400">
        No money moves through Wafa. This is a shared record of your agreement.
      </p>

      <div className="mt-6 rounded-2xl border border-warm-200 bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Timeline</h2>
        <AuditTimeline
          events={events}
          youId={user!.id}
          otherName={loan.counterpartyName}
        />
      </div>
    </main>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-coral-strong"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
