"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { inputClass, labelClass, btnPrimary } from "@/lib/ui";

const DEMO_PASSWORD = "Wafa-demo-1";
const DEMO_ACCOUNTS = [
  { label: "Aisha", email: "aisha@wafa.test" },
  { label: "Omar", email: "omar@wafa.test" },
  { label: "Layla", email: "layla@wafa.test" },
  { label: "Yusuf", email: "yusuf@wafa.test" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: string, p: string) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: e,
      password: p,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          signIn(email, password);
        }}
        className="space-y-3.5"
      >
        <div className="space-y-1">
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Your password"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-warm-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2.5 text-xs text-warm-400">
            or try a demo account
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            disabled={loading}
            onClick={() => signIn(acc.email, DEMO_PASSWORD)}
            className="flex items-center gap-2.5 rounded-xl border border-warm-300 bg-card px-3 py-2.5 text-left transition duration-150 ease-[var(--ease-out-quint)] hover:border-brand-line hover:bg-paper disabled:opacity-60 focus-ring"
          >
            <Avatar name={acc.label} size={30} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">
                {acc.label}
              </span>
              <span className="block text-xs text-warm-400">Demo</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
