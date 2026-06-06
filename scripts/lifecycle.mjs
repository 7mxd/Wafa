// Exercises the full write lifecycle via PostgREST RPCs (the path the server
// actions use): create -> approve -> mark_transferred -> confirm_settled.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OMAR = "22222222-2222-2222-2222-222222222222";

async function asUser(email) {
  const sb = createClient(SB_URL, SB_KEY);
  const { error } = await sb.auth.signInWithPassword({ email, password: "Wafa-demo-1" });
  if (error) throw new Error(`${email}: ${error.message}`);
  return sb;
}
function check(label, error) {
  console.log(`${error ? "FAIL" : "ok  "} ${label}${error ? " :: " + error.message : ""}`);
  if (error) process.exitCode = 1;
}

const aisha = await asUser("aisha@wafa.test");
const omar = await asUser("omar@wafa.test");

const c = await aisha.rpc("create_loan", {
  p_lender_id: OMAR,
  p_amount: 333,
  p_reason: "Lifecycle test (auto-cleaned)",
  p_due_date: "2026-06-30",
});
check("create_loan (Aisha)", c.error);
const loanId = c.data;

check("approve_loan (Omar)", (await omar.rpc("approve_loan", { p_loan_id: loanId })).error);
check("mark_transferred (Aisha)", (await aisha.rpc("mark_transferred", { p_loan_id: loanId })).error);
check("confirm_settled (Omar)", (await omar.rpc("confirm_settled", { p_loan_id: loanId })).error);

const { data: loan } = await aisha.from("loans").select("status").eq("id", loanId).single();
const { data: events } = await aisha
  .from("loan_events")
  .select("kind")
  .eq("loan_id", loanId)
  .order("created_at");
console.log(`final status: ${loan?.status} | events: ${(events ?? []).map((e) => e.kind).join(" → ")}`);
console.log(`CLEANUP_LOAN_ID=${loanId}`);
process.exit(process.exitCode ?? 0);
