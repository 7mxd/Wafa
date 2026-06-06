import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-stone-900">
            Wafa
          </span>
          <span className="hidden text-xs text-stone-400 sm:inline">
            qard hasan
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/new"
            className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            New request
          </Link>
          <span className="hidden text-sm text-stone-500 sm:inline">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-stone-500 transition hover:text-stone-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
