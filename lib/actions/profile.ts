"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

/** Save or clear the signed-in user's IBAN. Empty input clears it. */
export async function setIban(rawIban: string): Promise<ActionResult> {
  const iban = rawIban.replace(/\s/g, "").toUpperCase();
  if (iban !== "" && !isValidIban(iban)) {
    return { error: "That IBAN doesn’t look valid. Check it for typos." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_iban", { p_iban: iban });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

/** The signed-in user's own IBAN (the column is unreadable via a normal select). */
export async function getMyIban(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_iban");
  if (error) return null;
  return (data as string | null) ?? null;
}
