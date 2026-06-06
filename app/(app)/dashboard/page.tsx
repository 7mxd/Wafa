import { createClient } from "@/lib/supabase/server";
import { getDashboardLoans, type LoanView } from "@/lib/loans";
import { LoanCard } from "@/components/loan-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { owedToMe, iOwe } = await getDashboardLoans(supabase, user!.id);
  const toReview = owedToMe.filter((l) => l.status === "pending").length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <Column
          title="Owed to me"
          subtitle="People who owe you"
          badge={toReview > 0 ? `${toReview} to review` : undefined}
          loans={owedToMe}
          emptyText="No one owes you yet."
        />
        <Column
          title="I owe / requested"
          subtitle="Your requests & debts"
          loans={iOwe}
          emptyText="You haven’t asked for anything yet."
        />
      </div>
    </main>
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
  badge?: string;
  loans: LoanView[];
  emptyText: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-stone-900">
            {title}
          </h2>
          <p className="text-xs text-stone-400">{subtitle}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            {badge}
          </span>
        )}
      </div>
      {loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-400">
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
