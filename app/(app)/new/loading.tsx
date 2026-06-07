import { Bar } from "@/components/skeletons";

/**
 * Shown instantly while the new-request render (auth + people picker) streams in.
 */
export default function NewRequestLoading() {
  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <Bar className="h-4 w-16 rounded" />
      <Bar className="mt-4 h-7 w-48 rounded-md" />
      <Bar className="mt-2 h-4 w-72 max-w-full rounded" />

      <div className="mt-5 space-y-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Bar className="h-3.5 w-24 rounded" />
            <Bar className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Bar className="h-11 w-full rounded-xl" />
      </div>
    </main>
  );
}
