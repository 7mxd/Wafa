import type { Database } from "@/lib/database.types";

export type LoanStatus = Database["public"]["Enums"]["loan_status"];

type StatusMeta = {
  label: string;
  /** Tailwind classes for the pill background/text/ring. */
  pill: string;
  /** Short, human description of what this state means. */
  blurb: string;
};

export const STATUS_META: Record<LoanStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    pill: "bg-amber-100/70 text-amber-800 ring-amber-600/25",
    blurb: "Waiting on the lender to decide.",
  },
  countered: {
    label: "Countered",
    pill: "bg-coral-tint text-coral-strong ring-coral-line",
    blurb: "The lender proposed different terms.",
  },
  active: {
    label: "Active",
    pill: "bg-brand-tint text-brand ring-brand-line",
    blurb: "Agreed and outstanding.",
  },
  repaid_pending: {
    label: "Awaiting confirmation",
    pill: "bg-violet-100/70 text-violet-800 ring-violet-600/25",
    blurb: "Borrower marked it transferred; lender to confirm.",
  },
  settled: {
    label: "Settled",
    pill: "bg-emerald-100 text-emerald-800 ring-emerald-700/25",
    blurb: "Repaid and confirmed. Done.",
  },
  declined: {
    label: "Declined",
    pill: "bg-rose-100/70 text-rose-800 ring-rose-600/25",
    blurb: "The lender declined this request.",
  },
  withdrawn: {
    label: "Withdrawn",
    pill: "bg-warm-200/70 text-warm-600 ring-warm-400/30",
    blurb: "The borrower withdrew this request.",
  },
};

/** Terminal states never change again. */
export const TERMINAL_STATUSES: LoanStatus[] = ["settled", "declined", "withdrawn"];
