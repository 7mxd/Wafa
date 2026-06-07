"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

/** Add a person to your list by email. Returns their display name on success. */
export async function addContactByEmail(
  email: string,
): Promise<ActionResult & { id?: string; name?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_contact_by_email", {
    p_email: email,
  });
  if (error) return { error: error.message };
  // The RPC returns only the name; read back the id of the row we just inserted
  // (the caller's most-recent contact) so the client can select them at once.
  const { data: rows } = await supabase
    .from("contacts")
    .select("contact_id")
    .order("created_at", { ascending: false })
    .limit(1);
  revalidatePath("/settings");
  revalidatePath("/new");
  return {
    id: (rows?.[0]?.contact_id as string | undefined) ?? undefined,
    name: (data as string) ?? undefined,
  };
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
