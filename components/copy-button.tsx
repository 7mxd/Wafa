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
      className="shrink-0 rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:bg-white"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
