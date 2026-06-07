"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LoanView } from "@/lib/loans";
import { formatAed, formatDate, formatIban } from "@/lib/format";
import { type PaymentDetails } from "@/lib/payment";
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
  lenderPayment,
}: {
  loan: LoanView;
  lenderPayment: PaymentDetails | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<
    "none" | "counter" | "decline" | "delete"
  >("none");

  const [cAmount, setCAmount] = useState(String(loan.amount));
  const [cDue, setCDue] = useState(loan.due_date ?? "");
  const [cNote, setCNote] = useState("");
  const [dReason, setDReason] = useState("");

  // Which action is in flight, so only the clicked button spins while the others
  // simply disable. `pending` spans the whole transition — the server action AND
  // the route repaint its revalidatePath triggers — so the spinner stays up until
  // the fresh UI is painted, not just until the network call returns.
  const spinning = (key: string) => pending && busy === key;

  function run(key: string, fn: () => Promise<ActionResult>) {
    setError(null);
    setBusy(key);
    start(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else setPanel("none");
      // No router.refresh() here: every action's revalidatePath("/loans/<id>")
      // already repaints this route when it resolves. The manual refresh just
      // refetched the same page a second time, doubling how long the buttons
      // stayed disabled.
    });
  }

  function remove() {
    setError(null);
    setBusy("delete");
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
          <Primary
            disabled={pending}
            loading={spinning("approve")}
            onClick={() => run("approve", () => approveLoan(loan.id))}
          >
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
            loading={spinning("counter")}
            onClick={() =>
              run("counter", () =>
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
          <Danger
            disabled={pending}
            loading={spinning("decline")}
            onClick={() => run("decline", () => declineLoan(loan.id, dReason || null))}
          >
            Confirm decline
          </Danger>
        </Panel>
      )}
      {loan.status === "pending" && isBorrower && (
        <div className="space-y-2">
          <Waiting>Waiting for {loan.counterpartyName} to respond.</Waiting>
          <Secondary
            disabled={pending}
            loading={spinning("withdraw")}
            onClick={() => run("withdraw", () => withdrawLoan(loan.id))}
          >
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
            <Primary
              disabled={pending}
              loading={spinning("accept")}
              onClick={() => run("accept", () => acceptCounter(loan.id))}
            >
              Accept counter
            </Primary>
            <Secondary
              disabled={pending}
              loading={spinning("withdraw")}
              onClick={() => run("withdraw", () => withdrawLoan(loan.id))}
            >
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
          <PaymentDetailsBlock
            payment={lenderPayment}
            name={loan.counterpartyName}
          />
          <Primary
            disabled={pending}
            loading={spinning("transfer")}
            onClick={() => run("transfer", () => markTransferred(loan.id))}
          >
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
          <Primary
            disabled={pending}
            loading={spinning("confirm")}
            onClick={() => run("confirm", () => confirmSettled(loan.id))}
          >
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
            <Danger disabled={pending} loading={spinning("delete")} onClick={remove}>
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

function Primary({ children, loading, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={btnPrimary}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}
function Secondary({ children, loading, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={btnSecondary}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}
function Danger({ children, loading, ...rest }: ButtonProps) {
  return (
    <button {...rest} className={btnDanger}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

type ButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
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

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
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

function PaymentDetailsBlock({
  payment,
  name,
}: {
  payment: PaymentDetails | null;
  name: string;
}) {
  const rows: {
    label: string;
    display: string;
    copyValue?: string;
    mono?: boolean;
  }[] = [];
  if (payment?.account_holder_name)
    rows.push({ label: "Account holder", display: payment.account_holder_name });
  if (payment?.bank_name) rows.push({ label: "Bank", display: payment.bank_name });
  if (payment?.iban)
    rows.push({
      label: "IBAN",
      display: formatIban(payment.iban),
      copyValue: payment.iban,
      mono: true,
    });
  if (payment?.account_number)
    rows.push({
      label: "Account number",
      display: payment.account_number,
      copyValue: payment.account_number,
      mono: true,
    });
  if (payment?.swift_bic)
    rows.push({
      label: "SWIFT / BIC",
      display: payment.swift_bic,
      copyValue: payment.swift_bic,
      mono: true,
    });

  return (
    <div className="rounded-xl border border-warm-200 bg-paper p-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-warm-400">
        Transfer to {name} to settle
      </p>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-sm text-warm-400">
          {name} hasn’t added payment details yet.
        </p>
      ) : (
        <dl className="mt-2.5 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <dt className="text-[0.65rem] font-medium uppercase tracking-wide text-warm-400">
                  {r.label}
                </dt>
                <dd
                  className={`truncate text-sm text-ink ${r.mono ? "font-mono" : "font-medium"}`}
                >
                  {r.display}
                </dd>
              </div>
              {r.copyValue && <CopyButton value={r.copyValue} label="Copy" />}
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
