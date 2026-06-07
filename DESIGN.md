# Wafa design system

Tokens live in [`app/globals.css`](app/globals.css) (`@theme`); the shared control vocabulary lives in [`lib/ui.ts`](lib/ui.ts). Colours are OKLCH; neutrals are tinted toward the paper hue (never pure `#000`/`#fff`).

## Color

Strategy: **committed-restrained.** Warm paper carries every surface, deep blue carries structure and primary action, coral is the ≤10% accent.

| Token | OKLCH | ~Hex | Role |
|---|---|---|---|
| `--color-sand` | `0.927 0.008 79` | `#e9e6df` | App shell / page background |
| `--color-paper` | `0.985 0.004 85` | `#faf9f7` | Quiet panels, second layer |
| `--color-card` | `0.997 0.0015 85` | near-white | Cards floating on sand |
| `--color-ink` | `0.25 0.012 65` | warm near-black | Text |
| `--color-brand` | `0.375 0.135 264` | `#243a8a` | Deep blue: primary, active, trust |
| `--color-coral` | `0.665 0.182 22` | `#ef5650` | Accent: the _waw_, attention, "your turn" |
| `--color-warm-50…900` | hue ~70 | — | Neutral scale (replaces stone) |

Brand and coral each ship `-strong` (hover/press), `-tint` (wash backgrounds), and `-line` (hairline rings).

**Status semantics** (`lib/status.ts`): pending → amber, countered → **coral** (needs your response), active → **brand blue** (agreed, outstanding), awaiting confirmation → violet, settled → **green** (the one place green is allowed: a positive terminal), declined → rose, withdrawn → warm neutral.

## Typography

Three families, each with a job:

- **Hanken Grotesk** (`--font-sans`) — display + body. Headings use `font-bold`/`font-extrabold` with tight tracking.
- **IBM Plex Sans Arabic** (`--font-arabic`) — the وفاء wordmark and any Arabic, `dir="rtl"`.
- **Geist Mono** (`--font-mono`) — all money and timestamps, `tabular-nums`, so figures line up like a ledger. Amounts render via [`<Money>`](components/money.tsx): a quiet "AED" label + mono figure.

Scale is fixed rem (not fluid). Hierarchy comes from weight + size contrast, not colour.

## Elevation & shape

- Cards: `rounded-2xl`, `border-warm-200`, `bg-card`, on the sand shell. Auth/hero card: `rounded-3xl`.
- Shadows are sparse and brand-tinted (`rgba(36,58,138,…)`), used for lift on hover and to float the key card, never as default decoration.
- Inputs and buttons: `rounded-xl`. One control vocabulary everywhere (`lib/ui.ts`): `inputClass`, `btnPrimary` (blue), `btnSecondary` (outline), `btnDanger` (rose outline), `btnCoral` (the AI assist).

## Components

- **Logo** (`components/logo.tsx`): `mark` | `lockup` | `stacked`, built from the cropped `public/wafa-mark.png`.
- **Avatar** (`components/avatar.tsx`): initial in a tinted circle; colour is hashed from the name (brand or coral) so the same friend reads consistently.
- **StatusPill**, **InterestFreeBadge** (a brand "seal" with a coral dot), **LoanCard**, **AuditTimeline** (coral "you are here" dot), **Money**, **BackLink**.

Every interactive control has hover, focus (`.focus-ring`, a 2px brand outline), active (`translate-y-px`), and disabled states.

## Motion

150–200ms, `--ease-out-quint` (`cubic-bezier(0.22, 1, 0.36, 1)`). No bounce. Only transform/opacity/colour transitions — never layout properties. Motion conveys state (press, hover lift), never decoration.

## Bans (project-specific, on top of the shared ones)

- No green as a primary or accent. Green means **settled** and nothing else.
- No em dashes in copy. Use periods, colons, or commas.
- No banking-table density. This is a personal ledger, not a finance console.
