"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEMO_PASSWORD = "Wafa-demo-1";
const DEMO_ACCOUNTS = [
  { label: "Aisha", email: "aisha@wafa.test" },
  { label: "Omar", email: "omar@wafa.test" },
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
        className="space-y-3"
      >
        <div>
          <label className="block text-xs font-medium text-stone-500" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Your password"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-xs text-stone-400">
            or use a demo account
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            disabled={loading}
            onClick={() => signIn(acc.email, DEMO_PASSWORD)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:opacity-60"
          >
            Sign in as {acc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
