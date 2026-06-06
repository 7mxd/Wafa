import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLoan, getLoanEvents } from "@/lib/loans";
import { StatusPill } from "@/components/status-pill";
import { InterestFreeBadge } from "@/components/interest-free-badge";
import { LoanActions } from "@/components/loan-actions";
import { AuditTimeline } from "@/components/audit-timeline";
import { formatAed, formatDate } from "@/lib/format";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loan = await getLoan(supabase, user!.id, id);
  if (!loan) notFound();
  const events = await getLoanEvents(supabase, id);

  let lenderIban: string | null = null;
  if (
    loan.role === "borrower" &&
    (loan.status === "active" || loan.status === "repaid_pending")
  ) {
    const { data } = await supabase.rpc("get_lender_iban", { p_loan_id: id });
    lenderIban = (data as string | null) ?? null;
  }

  const verb = loan.role === "lender" ? "Lent to" : "Borrowed from";

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Link
        href="/dashboard"
        className="text-sm text-stone-500 transition hover:text-stone-900"
      >
        ← Dashboard
      </Link>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-stone-400">{verb}</p>
            <h1 className="text-lg font-semibold text-stone-900">
              {loan.counterpartyName}
            </h1>
          </div>
          <StatusPill status={loan.status} />
        </div>

        <div className="mt-4">
          <p className="text-3xl font-semibold tracking-tight text-stone-900">
            {formatAed(loan.amount)}
          </p>
          <p className="mt-1 text-sm text-stone-600">{loan.reason}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            {loan.due_date && <span>Due {formatDate(loan.due_date)}</span>}
            <InterestFreeBadge />
          </div>
        </div>

        {loan.status === "countered" && loan.counter_amount != null && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm">
            <p className="font-medium text-blue-900">Counter-offer</p>
            <p className="mt-1 text-blue-800">
              {formatAed(loan.amount)} →{" "}
              <span className="font-semibold">
                {formatAed(loan.counter_amount)}
              </span>
              {loan.counter_due_date
                ? ` · due ${formatDate(loan.counter_due_date)}`
                : ""}
            </p>
            {loan.counter_note && (
              <p className="mt-1 text-blue-700">“{loan.counter_note}”</p>
            )}
          </div>
        )}

        {loan.ai_summary && (
          <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
            {loan.ai_summary}
          </p>
        )}

        <div className="mt-5 border-t border-stone-100 pt-5">
          <LoanActions loan={loan} lenderIban={lenderIban} />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-stone-400">
        No money moves through Wafa — this is a shared record of your agreement.
      </p>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-stone-900">Timeline</h2>
        <AuditTimeline
          events={events}
          youId={user!.id}
          otherName={loan.counterpartyName}
        />
      </div>
    </main>
  );
}
