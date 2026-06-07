import type { LoanEvent } from "@/lib/loans";
import { formatDateTime } from "@/lib/format";

const KIND_VERB: Record<string, string> = {
  requested: "requested the loan",
  approved: "approved it",
  countered: "proposed new terms",
  counter_accepted: "accepted the counter",
  declined: "declined",
  withdrawn: "withdrew the request",
  marked_repaid: "marked it transferred",
  confirmed_settled: "confirmed receipt",
};

export function AuditTimeline({
  events,
  youId,
  otherName,
}: {
  events: LoanEvent[];
  youId: string;
  otherName: string;
}) {
  return (
    <ol className="space-y-3">
      {events.map((e, i) => {
        const who = e.actor_id === youId ? "You" : otherName;
        const verb = KIND_VERB[e.kind] ?? e.kind;
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 shrink-0 rounded-full ${
                  last
                    ? "h-2.5 w-2.5 bg-coral ring-4 ring-coral/15"
                    : "h-2 w-2 bg-warm-300"
                }`}
              />
              {!last && <span className="mt-1 w-px flex-1 bg-warm-200" />}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm text-warm-700">
                <span className="font-semibold text-ink">{who}</span> {verb}
              </p>
              {e.note && (
                <p className="mt-0.5 text-sm text-warm-500">“{e.note}”</p>
              )}
              <p className="mt-0.5 font-mono text-xs text-warm-400">
                {formatDateTime(e.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
