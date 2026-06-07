import type { ReactNode } from "react";

/**
 * Fades its children up with an optional stagger delay. Pure CSS (see the
 * `.reveal` rule in globals.css), so it never depends on JavaScript and can
 * never leave content hidden; honours prefers-reduced-motion.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`reveal ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
