"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_PAYMENT_DETAILS, type PaymentDetails } from "@/lib/payment";

export type ActionResult = { error?: string };

/** Full IBAN validity: structural shape + the ISO 7064 mod-97 checksum. */
function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  // Move the first 4 chars to the end, map letters to numbers (A=10…Z=35),
  // then check the big number is congruent to 1 mod 97.
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const mapped =
      ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (const digit of mapped) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

/** Save or clear the signed-in user's payment details. Empty fields clear. */
export async function setPaymentDetails(
  input: PaymentDetails,
): Promise<ActionResult> {
  const iban = (input.iban ?? "").replace(/\s/g, "").toUpperCase();
  if (iban !== "" && !isValidIban(iban)) {
    return { error: "That IBAN doesn’t look valid. Check it for typos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_payment_details", {
    p_iban: iban,
    p_account_holder_name: input.account_holder_name ?? "",
    p_bank_name: input.bank_name ?? "",
    p_account_number: input.account_number ?? "",
    p_swift_bic: input.swift_bic ?? "",
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

/** The signed-in user's own payment details (columns unreadable via a select). */
export async function getMyPaymentDetails(): Promise<PaymentDetails> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_payment_details");
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return EMPTY_PAYMENT_DETAILS;
  }
  const d = data as unknown as Partial<Record<keyof PaymentDetails, string | null>>;
  return {
    iban: d.iban ?? null,
    account_holder_name: d.account_holder_name ?? null,
    bank_name: d.bank_name ?? null,
    account_number: d.account_number ?? null,
    swift_bic: d.swift_bic ?? null,
  };
}
