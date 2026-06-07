"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

/** Add a person to your list by email. Returns their display name on success. */
export async function addContactByEmail(
  email: string,
): Promise<ActionResult & { name?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_contact_by_email", {
    p_email: email,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/new");
  return { name: (data as string) ?? undefined };
}

/** Remove a person from your list. */
export async function removeContact(contactId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_contact", {
    p_contact_id: contactId,
  });
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/new");
  return {};
}
