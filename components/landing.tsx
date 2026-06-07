import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { StatusPill } from "@/components/status-pill";
import { Avatar } from "@/components/avatar";
import { Money } from "@/components/money";
import { InterestFreeBadge } from "@/components/interest-free-badge";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import type { LoanStatus } from "@/lib/status";

export function Landing() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-warm-200/70 bg-sand/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Logo variant="lockup" />
          <Link href="/login" className={`${btnPrimary} px-4 py-2`}>
            Sign in
          </Link>
        </div>
      </header>

      <main>
        <Hero />
        <ValueProps />
        <HowItWorks />
        <Glimpse />
        <ClosingCta />
      </main>

      <LandingFooter />
    </>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
      {/* geometric texture, faded toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        style={{ backgroundImage: "url(/wafa-pattern.svg)", backgroundSize: "48px 48px" }}
      />
      {/* soft brand + coral auras behind the mark */}
      <div
        aria-hidden
        className="anim-aura pointer-events-none absolute left-1/2 top-10 -z-10 h-64 w-64 -translate-x-1/2 rounded-full blur-2xl sm:top-16"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.665 0.182 22 / 0.30), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="anim-aura pointer-events-none absolute left-1/2 top-28 -z-10 h-72 w-80 -translate-x-[60%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.375 0.135 264 / 0.22), transparent 70%)",
          animationDelay: "1.5s",
        }}
      />

      <div className="mx-auto max-w-3xl">
        <span className="anim-float inline-block">
          <Image
            src="/wafa-mark.png"
            alt=""
            width={104}
            height={104}
            priority
            sizes="104px"
            className="anim-mark mx-auto"
            style={{ width: 104, height: 104 }}
          />
        </span>

        <h1
          className="anim-rise mt-6 text-balance text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-ink sm:text-6xl"
          style={{ animationDelay: "120ms" }}
        >
          A promise, kept.
        </h1>

        <p
          className="anim-rise mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-warm-600 sm:text-lg"
          style={{ animationDelay: "220ms" }}
        >
          A shared, interest-free record of loans between people who trust each
          other. No money moves; nothing is forgotten.
        </p>

        <div
          className="anim-rise mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "320ms" }}
        >
          <Link href="/login" className={`${btnPrimary} px-5 py-3 text-base`}>
            Sign in
          </Link>
          <a href="#how" className={`${btnSecondary} px-5 py-3 text-base`}>
            See how it works
          </a>
        </div>

        <div
          className="anim-rise mt-6 flex justify-center"
          style={{ animationDelay: "400ms" }}
        >
          <InterestFreeBadge />
        </div>
      </div>
    </section>
  );
}

/* ── Value props ───────────────────────────────────────────── */

const VALUE_PROPS: {
  tint: "brand" | "coral";
  icon: React.ReactNode;
  title: string;
  desc: string;
}[] = [
  {
    tint: "brand",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.4-3 7-7 9-4-2-7-4.6-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    title: "Interest-free by design",
    desc: "Qard hasan: you repay exactly what you borrowed. No interest, no fees, ever.",
  },
  {
    tint: "coral",
    icon: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    title: "A record, not a wallet",
    desc: "No money moves through Wafa. It holds the agreement, so nobody has to keep score.",
  },
  {
    tint: "brand",
    icon: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 17h6a4 4 0 004-4V8" />
      </>
    ),
    title: "Tracked to settled",
    desc: "From the first ask to the final confirmation, every step on one shared timeline.",
  },
];

function ValueProps() {
  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3 sm:gap-6">
        {VALUE_PROPS.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <div className="text-center sm:text-left">
              <span
                className={`inline-grid h-11 w-11 place-items-center rounded-2xl ring-1 ring-inset ${
                  p.tint === "coral"
                    ? "bg-coral-tint text-coral-strong ring-coral-line"
                    : "bg-brand-tint text-brand ring-brand-line"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {p.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{p.title}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-warm-600 sm:mx-0">
                {p.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── How it works ──────────────────────────────────────────── */

const STEPS: {
  n: string;
  status: LoanStatus;
  title: string;
  desc: string;
}[] = [
  {
    n: "01",
    status: "pending",
    title: "Request",
    desc: "A friend asks in plain words. AI tidies it into an amount, reason, and date.",
  },
  {
    n: "02",
    status: "countered",
    title: "Decide",
    desc: "The lender approves, counters with new terms, or declines.",
  },
  {
    n: "03",
    status: "active",
    title: "Transfer",
    desc: "Money moves between you, your own way. The borrower marks it sent.",
  },
  {
    n: "04",
    status: "settled",
    title: "Settled",
    desc: "The lender confirms receipt. Done, and kept on the record.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-warm-600">
            Four steps, from a favor asked to a debt settled.
          </p>
        </Reveal>

        <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <li className="relative">
                <span className="font-mono text-sm font-medium text-warm-300">
                  {s.n}
                </span>
                <div className="mt-2">
                  <StatusPill status={s.status} />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-warm-600">
                  {s.desc}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Glimpse of the product ────────────────────────────────── */

function Glimpse() {
  return (
    <section className="px-5 py-4 sm:px-8">
      <div className="mx-auto grid max-w-5xl items-center gap-10 rounded-3xl border border-warm-200 bg-card/70 p-8 sm:p-10 lg:grid-cols-2">
        <Reveal>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              A ledger you can trust
            </h2>
            <p className="mt-3 max-w-md text-warm-600">
              Every loan, on a calm shared page: who, how much, what for, and
              exactly where it stands. Amounts in plain numbers, status you can
              read at a glance.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-brand transition hover:gap-2.5 focus-ring"
            >
              Try it with a demo account
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative">
            <div
              aria-hidden
              className="absolute -right-2 -top-3 h-full w-full rounded-2xl border border-warm-200 bg-paper/60"
            />
            <div className="relative rounded-2xl border border-warm-200 bg-card p-4 shadow-[0_18px_40px_-22px_rgba(36,58,138,0.35)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name="Aisha" />
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-medium uppercase tracking-wide text-warm-400">
                      Lent to
                    </p>
                    <p className="truncate font-semibold text-ink">Aisha</p>
                  </div>
                </div>
                <StatusPill status="active" />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <Money
                    amount={1200}
                    className="text-lg font-semibold tracking-tight text-ink"
                  />
                  <p className="mt-0.5 truncate text-sm text-warm-500">
                    Car repair before the weekend
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-warm-500">
                  Due in 13d
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Closing CTA ───────────────────────────────────────────── */

function ClosingCta() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand px-6 py-16 text-center sm:py-20">
        <Image
          src="/wafa-mark.png"
          alt=""
          width={320}
          height={320}
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-8 select-none opacity-[0.08] blur-[1px]"
        />
        <Reveal className="relative">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start with a single favor.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-white/70">
            Lend or borrow, interest-free, and keep it on the record. It takes a
            minute.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-3 text-base font-semibold text-brand shadow-sm transition duration-150 ease-[var(--ease-out-quint)] hover:bg-warm-50 active:translate-y-px focus-ring"
            >
              Sign in to Wafa
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────── */

function LandingFooter() {
  return (
    <footer className="border-t border-warm-200 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo variant="lockup" />
        <p className="max-w-sm text-xs leading-relaxed text-warm-400">
          No money moves through Wafa. A record of agreement, kept faithfully.
        </p>
        <a
          href="https://github.com/7mxd/Wafa"
          target="_blank"
          rel="noreferrer"
          className="rounded text-xs font-medium text-warm-500 transition hover:text-ink focus-ring"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
