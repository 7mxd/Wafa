import Link from "next/link";

export function BackLink({
  href = "/dashboard",
  children = "Dashboard",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded text-sm font-medium text-warm-500 transition hover:text-ink focus-ring"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {children}
    </Link>
  );
}
