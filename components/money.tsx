import { formatAmount } from "@/lib/format";

/**
 * A prominent amount: a quiet "AED" label with the figure in mono tabular
 * numerals, so columns of money line up and read like a ledger.
 */
export function Money({
  amount,
  className = "",
  signed = false,
}: {
  amount: number;
  className?: string;
  signed?: boolean;
}) {
  const sign = signed && amount > 0 ? "+ " : signed && amount < 0 ? "− " : "";
  const figure = formatAmount(signed ? Math.abs(amount) : amount);
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      <span className="mr-1 align-[0.5px] text-[0.6em] font-semibold tracking-wide opacity-60">
        AED
      </span>
      {sign}
      {figure}
    </span>
  );
}
