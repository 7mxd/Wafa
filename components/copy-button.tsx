"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable — no-op
        }
      }}
      className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition focus-ring ${
        copied
          ? "border-brand-line bg-brand-tint text-brand"
          : "border-warm-300 text-warm-700 hover:border-warm-400 hover:bg-paper"
      }`}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
