"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setPaymentDetails } from "@/lib/actions/profile";
import { type PaymentDetails } from "@/lib/payment";
import { formatIban } from "@/lib/format";
import { inputClass, labelClass, btnPrimary } from "@/lib/ui";

type FormState = {
  account_holder_name: string;
  iban: string;
  bank_name: string;
  account_number: string;
  swift_bic: string;
};

function toForm(d: PaymentDetails): FormState {
  return {
    account_holder_name: d.account_holder_name ?? "",
    iban: d.iban ? formatIban(d.iban) : "",
    bank_name: d.bank_name ?? "",
    account_number: d.account_number ?? "",
    swift_bic: d.swift_bic ?? "",
  };
}

export function PaymentDetailsForm({ initial }: { initial: PaymentDetails }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await setPaymentDetails(form);
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
      className="space-y-3.5"
    >
      <Field label="Account holder name">
        <input
          value={form.account_holder_name}
          onChange={(e) => set("account_holder_name", e.target.value)}
          className={inputClass}
          placeholder="As it appears on the account"
          autoComplete="off"
        />
      </Field>
      <Field label="IBAN">
        <input
          value={form.iban}
          onChange={(e) => set("iban", e.target.value)}
          className={`${inputClass} font-mono tracking-wide`}
          placeholder="AE07 0331 2345 6789 0123 456"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <Field label="Bank name">
        <input
          value={form.bank_name}
          onChange={(e) => set("bank_name", e.target.value)}
          className={inputClass}
          placeholder="e.g. Emirates NBD"
          autoComplete="off"
        />
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Account number">
          <input
            value={form.account_number}
            onChange={(e) => set("account_number", e.target.value)}
            className={`${inputClass} font-mono`}
            placeholder="Optional"
            autoComplete="off"
          />
        </Field>
        <Field label="SWIFT / BIC">
          <input
            value={form.swift_bic}
            onChange={(e) => set("swift_bic", e.target.value)}
            className={`${inputClass} font-mono uppercase placeholder:normal-case`}
            placeholder="Optional"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </div>

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

      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
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
