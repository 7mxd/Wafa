import { getMyPaymentDetails } from "@/lib/actions/profile";
import { getContacts } from "@/lib/loans";
import { createClient } from "@/lib/supabase/server";
import { PaymentDetailsForm } from "@/components/payment-details-form";
import { ContactsManager } from "@/components/contacts-manager";
import { BackLink } from "@/components/back-link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [payment, contacts] = await Promise.all([
    getMyPaymentDetails(),
    getContacts(supabase),
  ]);

  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-1.5 text-sm text-warm-500">Your account details.</p>

      <section className="mt-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Payment details</h2>
        <p className="mt-1 text-sm leading-relaxed text-warm-500">
          Shared with a borrower only after you approve their loan, so they can
          repay you. Stays private otherwise. All fields are optional.
        </p>
        <div className="mt-4">
          <PaymentDetailsForm initial={payment} />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Your people</h2>
        <p className="mt-1 text-sm leading-relaxed text-warm-500">
          The people you can ask for a loan. Add anyone by email and they stay
          here for next time.
        </p>
        <div className="mt-4">
          <ContactsManager initial={contacts} />
        </div>
      </section>
    </main>
  );
}
