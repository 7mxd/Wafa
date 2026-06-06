import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Loan = Database["public"]["Tables"]["loans"]["Row"];
export type LoanEvent = Database["public"]["Tables"]["loan_events"]["Row"];
export type Role = "borrower" | "lender";

export type LoanView = Loan & {
  role: Role;
  counterpartyId: string;
  counterpartyName: string;
};

type DB = SupabaseClient<Database>;

async function namesForLoans(
  supabase: DB,
  loans: Loan[],
): Promise<Map<string, string>> {
  const ids = Array.from(
    new Set(loans.flatMap((l) => [l.borrower_id, l.lender_id])),
  );
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("public_profiles")
    .select("id, display_name")
    .in("id", ids);
  return new Map(
    (data ?? []).map((p) => [p.id as string, p.display_name ?? "Someone"]),
  );
}

function toView(loan: Loan, userId: string, names: Map<string, string>): LoanView {
  const role: Role = loan.borrower_id === userId ? "borrower" : "lender";
  const counterpartyId =
    role === "borrower" ? loan.lender_id : loan.borrower_id;
  return {
    ...loan,
    role,
    counterpartyId,
    counterpartyName: names.get(counterpartyId) ?? "Someone",
  };
}

/**
 * All of the signed-in user's loans (RLS already scopes to their rows),
 * partitioned into the two-column ledger.
 *   owedToMe  → loans where the user is the lender
 *   iOwe      → loans where the user is the borrower
 */
export async function getDashboardLoans(
  supabase: DB,
  userId: string,
): Promise<{ owedToMe: LoanView[]; iOwe: LoanView[] }> {
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const loans = data ?? [];
  const names = await namesForLoans(supabase, loans);
  const views = loans.map((l) => toView(l, userId, names));

  return {
    owedToMe: views.filter((v) => v.role === "lender"),
    iOwe: views.filter((v) => v.role === "borrower"),
  };
}

/** A single loan (RLS-scoped) as a role-aware view, or null if not visible. */
export async function getLoan(
  supabase: DB,
  userId: string,
  loanId: string,
): Promise<LoanView | null> {
  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const names = await namesForLoans(supabase, [data]);
  return toView(data, userId, names);
}

/** The audit timeline for a loan, oldest first. */
export async function getLoanEvents(
  supabase: DB,
  loanId: string,
): Promise<LoanEvent[]> {
  const { data, error } = await supabase
    .from("loan_events")
    .select("*")
    .eq("loan_id", loanId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Other users the signed-in user can request from (the lender picker). */
export async function getOtherProfiles(
  supabase: DB,
  userId: string,
): Promise<{ id: string; display_name: string }[]> {
  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, display_name")
    .neq("id", userId)
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id as string,
    display_name: p.display_name ?? "Someone",
  }));
}
