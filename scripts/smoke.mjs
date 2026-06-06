// End-to-end smoke test against the live Supabase API (PostgREST + Auth).
// Verifies: demo login, RLS scoping per user, get_lender_iban RPC, IBAN column
// protection, and anon lockout. Run: node scripts/smoke.mjs
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const A3 = "00000000-0000-0000-0000-0000000000a3"; // active loan, Aisha borrows from Omar

async function asUser(email, password) {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return sb;
}

const aisha = await asUser("aisha@wafa.test", "Wafa-demo-1");
const omar = await asUser("omar@wafa.test", "Wafa-demo-1");

const aLoans = (await aisha.from("loans").select("status,role:borrower_id").order("created_at")).data ?? [];
const oLoans = (await omar.from("loans").select("status").order("created_at")).data ?? [];
console.log(`Aisha sees ${aLoans.length} loans, Omar sees ${oLoans.length} loans (each is a party to all 7).`);

const { data: iban, error: ibErr } = await aisha.rpc("get_lender_iban", { p_loan_id: A3 });
console.log(`get_lender_iban(active, as borrower Aisha) -> ${iban ?? "ERR:" + ibErr?.message}`);

const { error: ibErr2 } = await omar.rpc("get_lender_iban", { p_loan_id: A3 });
console.log(`get_lender_iban(active, as lender Omar)    -> ${ibErr2 ? "denied: " + ibErr2.message : "LEAKED!"}`);

const { error: colErr } = await aisha.from("profiles").select("iban").limit(1);
console.log(`select iban from profiles (Aisha)          -> ${colErr ? "denied: " + colErr.message : "LEAKED!"}`);

const anon = createClient(SUPABASE_URL, SUPABASE_KEY);
const { data: anonLoans, error: anonErr } = await anon.from("loans").select("id");
console.log(`anon select loans                          -> ${(anonLoans ?? []).length} rows${anonErr ? " (err: " + anonErr.message + ")" : ""}`);

process.exit(0);
