"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/lib/actions/loans";

type Person = { id: string; display_name: string };

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function NewRequestForm({ people }: { people: Person[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [lenderId, setLenderId] = useState(people[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  if (people.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No one else is on Wafa yet to ask. Invite a friend to sign up first.
      </p>
    );
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
        setAiNote("Filled in below from your description — edit anything.");
      } else {
        setAiNote("Couldn’t structure that — just fill it in below.");
      }
    } catch {
      setAiNote("Couldn’t structure that — just fill it in below.");
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
        <label className="text-xs font-medium text-emerald-800">
          Describe it in your own words
        </label>
        <textarea
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          placeholder="e.g. need 400 for a car repair, pay you back in two weeks"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={structureWithAI}
            disabled={aiLoading || !aiText.trim()}
            className="shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {aiLoading ? "Structuring…" : "Structure with AI ✨"}
          </button>
          {aiNote && <span className="text-xs text-emerald-700">{aiNote}</span>}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-xs text-stone-400">or fill it in</span>
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
        <label className="block">
          <span className="text-xs font-medium text-stone-500">Ask</span>
          <select
            value={lenderId}
            onChange={(e) => setLenderId(e.target.value)}
            className={inputCls}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">Amount (AED)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputCls}
            placeholder="500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">What for?</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputCls}
            placeholder="Car repair before the weekend"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-stone-500">
            Pay back by (optional)
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send request"}
        </button>
        <p className="text-center text-xs text-stone-400">
          Interest-free by design — you’ll never owe more than you borrow.
        </p>
      </form>
    </div>
  );
}
