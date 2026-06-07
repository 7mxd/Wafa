"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setIban } from "@/lib/actions/profile";
import { formatIban } from "@/lib/format";
import { inputClass, btnPrimary } from "@/lib/ui";

export function IbanForm({ initialIban }: { initialIban: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(
    initialIban ? formatIban(initialIban) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await setIban(value);
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-3"
    >
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        autoComplete="off"
        spellCheck={false}
        placeholder="AE07 0331 2345 6789 0123 456"
        aria-label="Your IBAN"
        className={`${inputClass} font-mono tracking-wide`}
      />
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-mint-strong">
          <CheckIcon /> Saved.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : "Save IBAN"}
        </button>
        {value.trim() !== "" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setValue("");
              setSaved(false);
              setError(null);
            }}
            className="rounded-lg px-1 text-sm font-medium text-warm-500 transition hover:text-rose-600 focus-ring disabled:opacity-60"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
