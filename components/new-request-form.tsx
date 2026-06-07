"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/lib/actions/loans";
import { addContactByEmail } from "@/lib/actions/contacts";
import { inputClass, labelClass, btnPrimary, btnCoral } from "@/lib/ui";

type Person = { id: string; display_name: string };

function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function NewRequestForm({ people: initialPeople }: { people: Person[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [lenderId, setLenderId] = useState(initialPeople[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // A person just added from the popup: drop them into the list (if new) and
  // select them, so the request can go out without leaving this screen.
  function handleAdded(person: Person) {
    setPeople((prev) =>
      prev.some((p) => p.id === person.id) ? prev : [...prev, person],
    );
    setLenderId(person.id);
    setError(null);
    setAddOpen(false);
  }

  async function structureWithAI() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiNote(null);
    try {
      const res = await fetch("/api/ai/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText, today: todayISO() }),
      });
      const json = await res.json();
      if (json?.ok) {
        setAmount(String(json.data.amount));
        setReason(json.data.reason);
        setDueDate(json.data.proposed_due_date || "");
        setAiSummary(json.data.summary || null);
        setAiNote("Filled in below from your description. Edit anything.");
      } else {
        setAiNote("Couldn’t structure that. Just fill it in below.");
      }
    } catch {
      setAiNote("Couldn’t structure that. Just fill it in below.");
    } finally {
      setAiLoading(false);
    }
  }

  function submit() {
    setError(null);
    if (!lenderId) return setError("Choose who you’re asking.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter an amount greater than zero.");
    if (!reason.trim()) return setError("Add a short reason.");
    start(async () => {
      const res = await createRequest({
        lenderId,
        amount: amt,
        reason: reason.trim(),
        dueDate: dueDate || null,
        aiSummary,
      });
      if (res.error) setError(res.error);
      else if (res.loanId) router.push(`/loans/${res.loanId}`);
    });
  }

  return (
    <div className="space-y-5">
      {/* AI intake */}
      <div className="rounded-2xl border border-brand-line bg-brand-tint/55 p-4">
        <label
          htmlFor="ai-text"
          className="flex items-center gap-1.5 text-xs font-semibold text-brand"
        >
          <Sparkle />
          Describe it in your own words
        </label>
        <textarea
          id="ai-text"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border border-brand-line bg-card px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-warm-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          placeholder="e.g. need 400 for a car repair, pay you back in two weeks"
        />
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={structureWithAI}
            disabled={aiLoading || !aiText.trim()}
            className={`${btnCoral} px-3 py-1.5`}
          >
            {aiLoading ? (
              "Structuring…"
            ) : (
              <>
                <Sparkle />
                Structure with AI
              </>
            )}
          </button>
          {aiNote && <span className="text-xs text-brand">{aiNote}</span>}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-warm-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2.5 text-xs text-warm-400">
            or fill it in
          </span>
        </div>
      </div>

      {/* manual form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={labelClass}>Who are you asking?</span>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1 rounded text-xs font-semibold text-brand transition hover:text-brand-bright focus-ring"
            >
              <PlusIcon />
              Add someone
            </button>
          </div>
          {people.length === 0 ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className={`${inputClass} flex items-center justify-between text-left text-warm-400 hover:border-brand-line`}
            >
              Add someone to ask…
              <PlusIcon />
            </button>
          ) : (
            <select
              value={lenderId}
              onChange={(e) => setLenderId(e.target.value)}
              aria-label="Who are you asking?"
              className={inputClass}
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className={labelClass}>Amount</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-warm-400">
              AED
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} pl-12 font-mono tabular-nums`}
              placeholder="500"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className={labelClass}>What for?</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
            placeholder="Car repair before the weekend"
          />
        </label>

        <label className="block space-y-1.5">
          <span className={labelClass}>Pay back by (optional)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "Sending…" : "Send request"}
        </button>
        <p className="text-center text-xs text-warm-400">
          Interest-free by design. You’ll never owe more than you borrow.
        </p>
      </form>

      {addOpen && (
        <AddPersonDialog
          onClose={() => setAddOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}

/** Popup to add a person by email, reusing the contacts action. On success it
 *  hands the new person back so the form can select them right away. */
function AddPersonDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (person: Person) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const value = email.trim();
    if (!value) {
      setError("Enter an email.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await addContactByEmail(value);
      if (res?.error) setError(res.error);
      else if (res?.id && res?.name)
        onAdded({ id: res.id, display_name: res.name });
      else onClose(); // added, but id unresolved — the list refreshes on its own
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add someone"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/30 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_24px_60px_-24px_rgba(36,58,138,0.45)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Add someone</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded text-xs font-medium text-warm-400 transition hover:text-warm-700 focus-ring"
          >
            Cancel
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-warm-500">
          Add a person by the email they signed up with. They’ll join your
          contacts and be selected here.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-3 space-y-2"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="friend@example.com"
            aria-label="Email"
            autoComplete="off"
            autoFocus
            className={inputClass}
          />
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className={`${btnPrimary} w-full`}
          >
            {pending ? "Adding…" : "Add to contacts"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Sparkle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5c.4 3.9 1.6 5.1 5.5 5.5-3.9.4-5.1 1.6-5.5 5.5-.4-3.9-1.6-5.1-5.5-5.5 3.9-.4 5.1-1.6 5.5-5.5Z" />
      <path d="M18.5 13c.2 2 .8 2.6 2.8 2.8-2 .2-2.6.8-2.8 2.8-.2-2-.8-2.6-2.8-2.8 2-.2 2.6-.8 2.8-2.8Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
