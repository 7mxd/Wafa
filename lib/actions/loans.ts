"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

function refresh(loanId?: string) {
  revalidatePath("/dashboard");
  if (loanId) revalidatePath(`/loans/${loanId}`);
}

export async function createRequest(input: {
  lenderId: string;
  amount: number;
  reason: string;
  dueDate: string | null;
  aiSummary?: string | null;
}): Promise<ActionResult & { loanId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_loan", {
    p_lender_id: input.lenderId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_due_date: input.dueDate ?? undefined,
    p_ai_summary: input.aiSummary ?? undefined,
  });
  if (error) return { error: error.message };
  refresh();
  return { loanId: data as string };
}

export async function approveLoan(loanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_loan", { p_loan_id: loanId });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

export async function counterLoan(
  loanId: string,
  input: { amount: number; dueDate: string | null; note: string | null },
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("counter_loan", {
    p_loan_id: loanId,
    p_counter_amount: input.amount,
    p_counter_due_date: input.dueDate ?? undefined,
    p_counter_note: input.note ?? undefined,
  });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

export async function declineLoan(
  loanId: string,
  reason: string | null,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_loan", {
    p_loan_id: loanId,
    p_decline_reason: reason ?? undefined,
  });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

export async function withdrawLoan(loanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_loan", { p_loan_id: loanId });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

export async function acceptCounter(loanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_counter", { p_loan_id: loanId });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

export async function markTransferred(loanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_transferred", {
    p_loan_id: loanId,
  });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

export async function confirmSettled(loanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_settled", {
    p_loan_id: loanId,
  });
  if (error) return { error: error.message };
  refresh(loanId);
  return {};
}

/** Permanently delete a finished loan (settled | declined | withdrawn). The RPC
 *  enforces caller-is-party and the terminal-status rule; events cascade away. */
export async function deleteLoan(loanId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_loan", { p_loan_id: loanId });
  if (error) return { error: error.message };
  refresh();
  return {};
}
