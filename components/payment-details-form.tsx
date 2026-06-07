"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setPaymentDetails } from "@/lib/actions/profile";
import { type PaymentDetails } from "@/lib/payment";
import { formatIban } from "@/lib/format";
import { inputClass, labelClass, btnPrimary, btnCoral } from "@/lib/ui";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    setExtracting(true);
    setExtractNote(null);
    setError(null);
    try {
      const image = await fileToDataUrl(file);
      const res = await fetch("/api/ai/extract-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const json = await res.json();
      if (json?.ok) {
        const d = json.data as Record<keyof FormState, string>;
        setForm((f) => ({
          account_holder_name: d.account_holder_name || f.account_holder_name,
          iban: d.iban ? formatIban(d.iban) : f.iban,
          bank_name: d.bank_name || f.bank_name,
          account_number: d.account_number || f.account_number,
          swift_bic: d.swift_bic || f.swift_bic,
        }));
        setSaved(false);
        setExtractNote("Filled from your photo. Check it, then save.");
      } else {
        setExtractNote("Couldn’t read that image. Just fill it in below.");
      }
    } catch {
      setExtractNote("Couldn’t read that image. Just fill it in below.");
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
      <div className="rounded-2xl border border-brand-line bg-brand-tint/55 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
          <CameraIcon />
          Add from a photo
        </p>
        <p className="mt-1 text-xs leading-relaxed text-warm-500">
          Snap your IBAN letter, bank card, or statement and the fields fill in
          below. The image is read once and never stored.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={extracting}
          className={`${btnCoral} mt-2.5 px-3 py-1.5`}
        >
          {extracting ? (
            "Reading…"
          ) : (
            <>
              <CameraIcon />
              Choose a photo
            </>
          )}
        </button>
        {extractNote && (
          <p className="mt-2 text-xs text-brand">{extractNote}</p>
        )}
      </div>

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

function CameraIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/** Downscale a picked image to a JPEG data URL, keeping the upload small enough
 *  for a quick vision call. */
async function fileToDataUrl(file: File, max = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}
