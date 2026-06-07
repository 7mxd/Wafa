import Image from "next/image";

type LogoVariant = "mark" | "lockup" | "stacked";

/**
 * Wafa brand lockup.
 *   mark    — the calligraphic waw, on its own
 *   lockup  — mark + "Wafa وفاء", horizontal (headers, nav)
 *   stacked — mark above "Wafa / وفاء", centered (hero moments)
 */
export function Logo({
  variant = "lockup",
  size,
  showArabic = true,
  className = "",
}: {
  variant?: LogoVariant;
  size?: number;
  showArabic?: boolean;
  className?: string;
}) {
  const markSize = size ?? (variant === "stacked" ? 64 : 30);

  const mark = (
    <Image
      src="/wafa-mark.png"
      alt={variant === "mark" ? "Wafa" : ""}
      width={markSize}
      height={markSize}
      priority
      sizes={`${markSize}px`}
      style={{ width: markSize, height: markSize }}
      className="shrink-0 select-none"
    />
  );

  if (variant === "mark") {
    return <span className={className}>{mark}</span>;
  }

  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-3 ${className}`}>
        {mark}
        <span className="flex flex-col items-center leading-[0.95]">
          <span className="font-sans text-[2.1rem] font-extrabold tracking-[-0.02em] text-brand">
            Wafa
          </span>
          {showArabic && (
            <span
              dir="rtl"
              lang="ar"
              className="font-arabic mt-1.5 text-[1.6rem] font-semibold text-coral"
            >
              وفاء
            </span>
          )}
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
      <span className="inline-flex items-baseline gap-1.5 leading-none">
        <span className="font-sans text-lg font-extrabold tracking-[-0.02em] text-brand">
          Wafa
        </span>
        {showArabic && (
          <span
            dir="rtl"
            lang="ar"
            className="font-arabic text-[0.95rem] font-semibold text-coral"
          >
            وفاء
          </span>
        )}
      </span>
    </span>
  );
}
