import { getMyIban } from "@/lib/actions/profile";
import { IbanForm } from "@/components/iban-form";
import { BackLink } from "@/components/back-link";

export default async function SettingsPage() {
  const iban = await getMyIban();

  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <BackLink />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
        Settings
      </h1>
      <p className="mt-1.5 text-sm text-warm-500">Your account details.</p>

      <section className="mt-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Your IBAN</h2>
        <p className="mt-1 text-sm leading-relaxed text-warm-500">
          Shared with a borrower only after you approve their loan, so they can
          transfer your repayment. It is never shown in the people directory.
        </p>
        <div className="mt-4">
          <IbanForm initialIban={iban} />
        </div>
      </section>
    </main>
  );
}
