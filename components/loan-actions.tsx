"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LoanView } from "@/lib/loans";
import { formatAed, formatDate, formatIban } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import {
  acceptCounter,
  approveLoan,
  confirmSettled,
  counterLoan,
  declineLoan,
  markTransferred,
  withdrawLoan,
  type ActionResult,
} from "@/lib/actions/loans";

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

export function LoanActions({
  loan,
  lenderIban,
}: {
  loan: LoanView;
  lenderIban: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"none" | "counter" | "decline">("none");

  const [cAmount, setCAmount] = useState(String(loan.amount));
  const [cDue, setCDue] = useState(loan.due_date ?? "");
  const [cNote, setCNote] = useState("");
  const [dReason, setDReason] = useState("");

  function run(fn: () => Promise<ActionResult>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else {
        setPanel("none");
        router.refresh();
      }
    });
  }

  const isBorrower = loan.role === "borrower";
  const isLender = loan.role === "lender";

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {/* pending */}
      {loan.status === "pending" && isLender && panel === "none" && (
        <div className="flex flex-wrap gap-2">
          <Primary disabled={pending} onClick={() => run(() => approveLoan(loan.id))}>
            Approve
          </Primary>
          <Secondary disabled={pending} onClick={() => setPanel("counter")}>
            Counter
          </Secondary>
          <Danger disabled={pending} onClick={() => setPanel("decline")}>
            Decline
          </Danger>
        </div>
      )}
      {loan.status === "pending" && isLender && panel === "counter" && (
        <Panel title="Propose different terms" onCancel={() => setPanel("none")}>
          <Field label="Amount (AED)">
            <input type="number" min="1" step="0.01" value={cAmount} onChange={(e) => setCAmount(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Due date">
            <input type="date" value={cDue} onChange={(e) => setCDue(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Note (optional)">
            <input value={cNote} onChange={(e) => setCNote(e.target.value)} className={inputCls} placeholder="Can do this much for now…" />
          </Field>
          <Primary
            disabled={pending}
            onClick={() =>
              run(() =>
                counterLoan(loan.id, {
                  amount: Number(cAmount),
                  dueDate: cDue || null,
                  note: cNote || null,
                }),
              )
            }
          >
            Send counter
          </Primary>
        </Panel>
      )}
      {loan.status === "pending" && isLender && panel === "decline" && (
        <Panel title="Decline this request" onCancel={() => setPanel("none")}>
          <Field label="Reason (optional)">
            <input value={dReason} onChange={(e) => setDReason(e.target.value)} className={inputCls} placeholder="A short note…" />
          </Field>
          <Danger disabled={pending} onClick={() => run(() => declineLoan(loan.id, dReason || null))}>
            Confirm decline
          </Danger>
        </Panel>
      )}
      {loan.status === "pending" && isBorrower && (
        <div className="space-y-2">
          <Waiting>Waiting for {loan.counterpartyName} to respond.</Waiting>
          <Secondary disabled={pending} onClick={() => run(() => withdrawLoan(loan.id))}>
            Withdraw request
          </Secondary>
        </div>
      )}

      {/* countered */}
      {loan.status === "countered" && isBorrower && (
        <div className="space-y-2">
          <Waiting>
            {loan.counterpartyName} proposed {formatAed(loan.counter_amount ?? 0)}
            {loan.counter_due_date ? ` · due ${formatDate(loan.counter_due_date)}` : ""}.
          </Waiting>
          <div className="flex flex-wrap gap-2">
            <Primary disabled={pending} onClick={() => run(() => acceptCounter(loan.id))}>
              Accept counter
            </Primary>
            <Secondary disabled={pending} onClick={() => run(() => withdrawLoan(loan.id))}>
              Withdraw
            </Secondary>
          </div>
        </div>
      )}
      {loan.status === "countered" && isLender && (
        <Waiting>You proposed new terms. Waiting for {loan.counterpartyName} to accept.</Waiting>
      )}

      {/* active */}
      {loan.status === "active" && isBorrower && (
        <div className="space-y-3">
          <IbanBlock iban={lenderIban} name={loan.counterpartyName} />
          <Primary disabled={pending} onClick={() => run(() => markTransferred(loan.id))}>
            I’ve transferred
          </Primary>
        </div>
      )}
      {loan.status === "active" && isLender && (
        <Waiting>Active — waiting for {loan.counterpartyName} to transfer the repayment.</Waiting>
      )}

      {/* repaid_pending */}
      {loan.status === "repaid_pending" && isLender && (
        <div className="space-y-2">
          <Waiting>{loan.counterpartyName} marked the repayment as transferred.</Waiting>
          <Primary disabled={pending} onClick={() => run(() => confirmSettled(loan.id))}>
            Confirm received
          </Primary>
        </div>
      )}
      {loan.status === "repaid_pending" && isBorrower && (
        <Waiting>You marked it transferred. Waiting for {loan.counterpartyName} to confirm.</Waiting>
      )}

      {/* terminal */}
      {loan.status === "settled" && (
        <Waiting tone="good">Settled — repaid and confirmed. Done.</Waiting>
      )}
      {loan.status === "declined" && (
        <Waiting>
          Declined{loan.decline_reason ? `: “${loan.decline_reason}”` : ""}.
        </Waiting>
      )}
      {loan.status === "withdrawn" && <Waiting>Withdrawn by the borrower.</Waiting>}
    </div>
  );
}

/* — small presentational helpers — */

function Primary({ children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
function Secondary({ children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className="rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
function Danger({ children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className="rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

type ButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

function Waiting({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "good";
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-stone-50 text-stone-500";
  return <p className={`rounded-lg px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

function Panel({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-900">{title}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-stone-400 hover:text-stone-700"
        >
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function IbanBlock({ iban, name }: { iban: string | null; name: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-medium text-stone-500">
        Transfer to {name} to settle
      </p>
      {iban ? (
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <code className="truncate font-mono text-sm text-stone-900">
            {formatIban(iban)}
          </code>
          <CopyButton value={iban} label="Copy IBAN" />
        </div>
      ) : (
        <p className="mt-1 text-sm text-stone-400">
          {name} hasn’t added an IBAN yet.
        </p>
      )}
    </div>
  );
}
