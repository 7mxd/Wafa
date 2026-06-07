import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/avatar";
import { btnPrimary } from "@/lib/ui";

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-warm-200 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 sm:px-6">
        <Link href="/dashboard" className="rounded-lg focus-ring">
          <Logo variant="lockup" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/new" className={`${btnPrimary} px-3.5 py-2`}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">New request</span>
            <span className="sm:hidden">New</span>
          </Link>

          <div className="hidden items-center gap-2.5 sm:flex">
            <Avatar name={email} size={28} />
            <span className="max-w-[11rem] truncate text-sm text-warm-500">
              {email}
            </span>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-1 text-sm font-medium text-warm-500 transition hover:text-ink focus-ring"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
