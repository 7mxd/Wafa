"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLoan } from "@/lib/actions/loans";

/**
 * Quick-delete affordance overlaid on a deletable (terminal) loan card. It is a
 * SIBLING of the card's <Link> — never nested inside it — so the markup stays
 * valid and its clicks don't trigger navigation. Deletion removes a shared
 * record, so it always confirms first.
 */
export function CardDeleteButton({
  loanId,
  name,
}: {
  loanId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    start(async () => {
      const res = await deleteLoan(loanId);
      if (res?.error) setError(res.error);
      else router.refresh(); // the card leaves the list
    });
  }

  if (confirming) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-rose-200 bg-card/95 px-4 text-center backdrop-blur-sm">
        <p className="text-sm font-medium leading-snug text-ink">
          Delete this record? It’s removed for both you and {name}.
        </p>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-warm-600 ring-1 ring-inset ring-warm-300 transition hover:bg-paper focus-ring disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-ring disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete the record of your loan with ${name}`}
      title="Delete this record"
      className="absolute right-2.5 top-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg text-warm-400 opacity-70 transition hover:bg-rose-50 hover:text-rose-600 hover:opacity-100 focus-visible:opacity-100 group-hover/card:opacity-100 focus-ring"
    >
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
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}
