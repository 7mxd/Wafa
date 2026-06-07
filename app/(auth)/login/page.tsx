import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="stacked" />
          <p className="mt-5 max-w-[18rem] text-balance text-sm leading-relaxed text-warm-600">
            Lend to a friend, written down. Interest-free, by design.
          </p>
        </div>

        <div className="rounded-3xl border border-warm-200 bg-card p-6 shadow-[0_24px_60px_-28px_rgba(36,58,138,0.30)]">
          <LoginForm />
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-warm-400">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          A record of agreement. No money moves through Wafa.
        </p>
      </div>
    </main>
  );
}
