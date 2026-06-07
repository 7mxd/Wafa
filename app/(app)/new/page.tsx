import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getOtherProfiles } from "@/lib/loans";
import { NewRequestForm } from "@/components/new-request-form";
import { BackLink } from "@/components/back-link";

export default async function NewRequestPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);
  const people = await getOtherProfiles(supabase, user!.id);

  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
        Ask for a loan
      </h1>
      <p className="mt-1.5 text-sm text-warm-500">
        Request an interest-free loan from a friend. They’ll approve, counter, or
        decline.
      </p>
      <div className="mt-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        <NewRequestForm people={people} />
      </div>
    </main>
  );
}
