"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LoanView } from "@/lib/loans";
import { formatAed, formatDate, formatIban } from "@/lib/format";
import { CopyButton } from "@/components/copy-button";
import { inputClass, btnPrimary, btnSecondary, btnDanger } from "@/lib/ui";
import {
  acceptCounter,
  approveLoan,
  confirmSettled,
  counterLoan,
  declineLoan,
  deleteLoan,
  markTransferred,
  withdrawLoan,
  type ActionResult,
} from "@/lib/actions/loans";
import { TERMINAL_STATUSES } from "@/lib/status";

const inputCls = `mt-1 ${inputClass}`;

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
  const [panel, setPanel] = useState<
    "none" | "counter" | "decline" | "delete"
  >("none");

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

  function remove() {
    setError(null);
    start(async () => {
      const res = await deleteLoan(loan.id);
      if (res?.error) setError(res.error);
      else router.push("/dashboard");
    });
  }

  const isBorrower = loan.role === "borrower";
  const isLender = loan.role === "lender";

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
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

      {/* delete — only finished loans that carry no remaining value */}
      {TERMINAL_STATUSES.includes(loan.status) &&
        (panel === "delete" ? (
          <Panel title="Delete this record?" onCancel={() => setPanel("none")}>
            <p className="text-sm leading-relaxed text-warm-600">
              This permanently removes the loan and its timeline for both you and{" "}
              {loan.counterpartyName}. It can’t be undone.
            </p>
            <Danger disabled={pending} onClick={remove}>
              Delete permanently
            </Danger>
          </Panel>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => setPanel("delete")}
              className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-warm-400 transition hover:text-rose-600 focus-ring disabled:opacity-60"
            >
              <TrashIcon />
              Delete this record
            </button>
          </div>
        ))}
    </div>
  );
}

/* — small presentational helpers — */

function Primary({ children, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={btnPrimary}>
      {children}
    </button>
  );
}
function Secondary({ children, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={btnSecondary}>
      {children}
    </button>
  );
}
function Danger({ children, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={btnDanger}>
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-warm-200 bg-paper text-warm-600";
  return (
    <p className={`rounded-xl border px-3 py-2.5 text-sm ${cls}`}>{children}</p>
  );
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
    <div className="space-y-3 rounded-xl border border-warm-200 bg-paper p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded text-xs font-medium text-warm-400 transition hover:text-warm-700 focus-ring"
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
      <span className="text-xs font-medium text-warm-500">{label}</span>
      {children}
    </label>
  );
}

function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IbanBlock({ iban, name }: { iban: string | null; name: string }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-paper p-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-warm-400">
        Transfer to {name} to settle
      </p>
      {iban ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <code className="truncate font-mono text-sm text-ink">
            {formatIban(iban)}
          </code>
          <CopyButton value={iban} label="Copy IBAN" />
        </div>
      ) : (
        <p className="mt-1.5 text-sm text-warm-400">
          {name} hasn’t added an IBAN yet.
        </p>
      )}
    </div>
  );
}
