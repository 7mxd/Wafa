"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addContactByEmail, removeContact } from "@/lib/actions/contacts";
import { Avatar } from "@/components/avatar";
import { inputClass, btnPrimary } from "@/lib/ui";

type Person = { id: string; display_name: string };

export function ContactsManager({ initial }: { initial: Person[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  function add() {
    setError(null);
    setAdded(null);
    const value = email.trim();
    if (!value) {
      setError("Enter an email.");
      return;
    }
    start(async () => {
      const res = await addContactByEmail(value);
      if (res?.error) setError(res.error);
      else {
        setAdded(res.name ?? "Added");
        setEmail("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    setError(null);
    setAdded(null);
    start(async () => {
      const res = await removeContact(id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setAdded(null);
              setError(null);
            }}
            placeholder="friend@example.com"
            aria-label="Add someone by email"
            autoComplete="off"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={pending}
            className={`${btnPrimary} shrink-0`}
          >
            {pending ? "Adding…" : "Add"}
          </button>
        </div>
        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {added && !error && (
          <p className="text-sm font-medium text-mint-strong">Added {added}.</p>
        )}
      </form>

      {initial.length === 0 ? (
        <p className="text-sm text-warm-400">
          No one yet. Add people by email to ask them for a loan.
        </p>
      ) : (
        <ul className="divide-y divide-warm-100 overflow-hidden rounded-xl border border-warm-200">
          {initial.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar name={p.display_name} size={28} />
                <span className="truncate text-sm font-medium text-ink">
                  {p.display_name}
                </span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(p.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-warm-400 transition hover:text-rose-600 focus-ring disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
