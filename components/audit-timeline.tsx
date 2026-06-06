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
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${last ? "bg-emerald-500" : "bg-stone-300"}`}
              />
              {!last && <span className="mt-1 w-px flex-1 bg-stone-200" />}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm text-stone-700">
                <span className="font-medium text-stone-900">{who}</span> {verb}
              </p>
              {e.note && (
                <p className="mt-0.5 text-sm text-stone-500">“{e.note}”</p>
              )}
              <p className="mt-0.5 text-xs text-stone-400">
                {formatDateTime(e.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
