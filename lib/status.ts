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
    pill: "bg-amber-50 text-amber-700 ring-amber-600/20",
    blurb: "Waiting on the lender to decide.",
  },
  countered: {
    label: "Countered",
    pill: "bg-blue-50 text-blue-700 ring-blue-600/20",
    blurb: "The lender proposed different terms.",
  },
  active: {
    label: "Active",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    blurb: "Agreed and outstanding.",
  },
  repaid_pending: {
    label: "Awaiting confirmation",
    pill: "bg-violet-50 text-violet-700 ring-violet-600/20",
    blurb: "Borrower marked it transferred; lender to confirm.",
  },
  settled: {
    label: "Settled",
    pill: "bg-emerald-100 text-emerald-800 ring-emerald-700/20",
    blurb: "Repaid and confirmed. Done.",
  },
  declined: {
    label: "Declined",
    pill: "bg-rose-50 text-rose-700 ring-rose-600/20",
    blurb: "The lender declined this request.",
  },
  withdrawn: {
    label: "Withdrawn",
    pill: "bg-stone-100 text-stone-500 ring-stone-500/20",
    blurb: "The borrower withdrew this request.",
  },
};

/** Terminal states never change again. */
export const TERMINAL_STATUSES: LoanStatus[] = ["settled", "declined", "withdrawn"];
