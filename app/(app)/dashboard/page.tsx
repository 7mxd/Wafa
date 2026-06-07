import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardLoans, type LoanView } from "@/lib/loans";
import { LoanCard } from "@/components/loan-card";
import { Money } from "@/components/money";
import { Logo } from "@/components/logo";
import { InterestFreeBadge } from "@/components/interest-free-badge";
import { btnPrimary } from "@/lib/ui";

const isOutstanding = (l: LoanView) =>
  l.status === "active" || l.status === "repaid_pending";

const sumOutstanding = (loans: LoanView[]) =>
  loans.filter(isOutstanding).reduce((total, l) => total + l.amount, 0);

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { owedToMe, iOwe } = await getDashboardLoans(supabase, user!.id);

  const hasAny = owedToMe.length + iOwe.length > 0;
  const owedToMeTotal = sumOutstanding(owedToMe);
  const iOweTotal = sumOutstanding(iOwe);
  const net = owedToMeTotal - iOweTotal;

  const reviewCount = owedToMe.filter((l) => l.status === "pending").length;
  const confirmCount = owedToMe.filter(
    (l) => l.status === "repaid_pending",
  ).length;
  const respondCount = iOwe.filter((l) => l.status === "countered").length;
  const needsYou = reviewCount + confirmCount + respondCount;

  if (!hasAny) {
    return (
      <main className="mx-auto max-w-3xl px-5 sm:px-6">
        <WelcomeEmpty />
      </main>
    );
  }

  const owedBadge =
    reviewCount > 0
      ? { text: `${reviewCount} to review`, tone: "amber" as const }
      : confirmCount > 0
        ? { text: `${confirmCount} to confirm`, tone: "coral" as const }
        : undefined;
  const oweBadge =
    respondCount > 0
      ? { text: `${respondCount} to respond`, tone: "coral" as const }
      : undefined;

  return (
    <main className="mx-auto max-w-3xl px-5 py-7 sm:px-6 sm:py-8">
      <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.25)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xs font-semibold uppercase tracking-wide text-warm-500">
            Your ledger
          </h1>
          {needsYou > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-tint px-2.5 py-1 text-xs font-semibold text-coral-strong ring-1 ring-inset ring-coral-line">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              {needsYou} need{needsYou === 1 ? "s" : ""} you
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-400">
              <CheckIcon />
              All caught up
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-warm-200">
          <Figure label="Owed to you" amount={owedToMeTotal} tone="brand" />
          <Figure label="You owe" amount={iOweTotal} tone="ink" />
          <Figure label="Net" amount={net} tone="net" signed />
        </div>
      </section>

      <div className="mt-7 grid gap-7 sm:grid-cols-2">
        <Column
          title="Owed to me"
          subtitle="People who owe you"
          badge={owedBadge}
          loans={owedToMe}
          emptyText="No one owes you right now."
        />
        <Column
          title="I owe"
          subtitle="Your requests and debts"
          badge={oweBadge}
          loans={iOwe}
          emptyText="You don’t owe anything right now."
        />
      </div>
    </main>
  );
}

function Figure({
  label,
  amount,
  tone,
  signed = false,
}: {
  label: string;
  amount: number;
  tone: "brand" | "ink" | "net";
  signed?: boolean;
}) {
  const color =
    tone === "brand"
      ? "text-brand"
      : tone === "net"
        ? amount > 0
          ? "text-brand"
          : amount < 0
            ? "text-coral-strong"
            : "text-warm-500"
        : "text-ink";
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <p className="text-[0.68rem] font-medium uppercase tracking-wide text-warm-400">
        {label}
      </p>
      <Money
        amount={amount}
        signed={signed}
        className={`mt-1 block text-lg font-semibold sm:text-2xl ${color}`}
      />
    </div>
  );
}

function Column({
  title,
  subtitle,
  badge,
  loans,
  emptyText,
}: {
  title: string;
  subtitle: string;
  badge?: { text: string; tone: "amber" | "coral" };
  loans: LoanView[];
  emptyText: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="text-xs text-warm-400">{subtitle}</p>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
              badge.tone === "coral"
                ? "bg-coral-tint text-coral-strong ring-coral-line"
                : "bg-amber-100/70 text-amber-800 ring-amber-600/25"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-warm-300 bg-paper/40 p-6 text-center text-sm text-warm-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </section>
  );
}

function WelcomeEmpty() {
  return (
    <div className="mx-auto max-w-md py-14 text-center sm:py-20">
      <Logo variant="mark" size={60} className="inline-flex" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">
        Welcome to Wafa
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-warm-600">
        A clear, interest-free record of money between you and the people you
        trust. Ask a friend for a loan, or wait for a request to land here.
      </p>
      <div className="mt-7 flex justify-center">
        <Link href="/new" className={btnPrimary}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ask for a loan
        </Link>
      </div>
      <div className="mt-7 flex justify-center">
        <InterestFreeBadge />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
