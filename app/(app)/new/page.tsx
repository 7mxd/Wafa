import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOtherProfiles } from "@/lib/loans";
import { NewRequestForm } from "@/components/new-request-form";

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const people = await getOtherProfiles(supabase, user!.id);

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Link
        href="/dashboard"
        className="text-sm text-stone-500 transition hover:text-stone-900"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-stone-900">
        Ask for a loan
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Request an interest-free loan from a friend. They’ll approve, counter, or
        decline.
      </p>
      <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-6">
        <NewRequestForm people={people} />
      </div>
    </main>
  );
}
