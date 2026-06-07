# Wafa design system

Tokens live in [`app/globals.css`](app/globals.css) (`@theme`); the shared control vocabulary lives in [`lib/ui.ts`](lib/ui.ts). Colours are OKLCH; neutrals carry a faint cool tint (never pure `#000`/`#fff`).

## Color

Strategy: a **fresh, bright canvas** with deep-blue + coral brand DNA and a joyful accent palette, used in committed colour moments (a gradient ledger band, mesh hero backdrops, gradient CTAs) rather than spread evenly. Trustworthy for fintech: no purple-blue gradients, no gradient text, solid white on drenched bands.

| Token | OKLCH | Role |
|---|---|---|
| `--color-sand` | `0.981 0.004 240` | App canvas (bright) |
| `--color-paper` | `0.966 0.006 242` | Quiet panels, second layer |
| `--color-card` | `0.996 0.0015 240` | Cards, near-white |
| `--color-ink` | `0.22 0.013 262` | Cool near-black text |
| `--color-brand` | `0.375 0.135 264` | Deep blue ≈ `#243a8a` (logo, text, active) |
| `--color-brand-bright` | `0.55 0.19 258` | Vivid azure: gradients, focus, energy |
| `--color-coral` | `0.665 0.182 22` | Coral ≈ `#ef5650`: the _waw_, attention |
| `--color-teal / -amber / -violet / -mint` | — | Joyful accents: avatars, categories, status |
| `--color-warm-50…900` | hue ~250 | Cool-neutral scale |

Every colour ships `-strong` (text/hover on a tint), `-tint` (wash background), and `-line` (hairline ring). Gradient helpers in `globals.css`: `.grad-brand` (deep → bright blue), `.grad-sunset` (coral → amber), `.grad-primary` (button fill), `.mesh-joy` (three-colour aura backdrop).

**Status semantics** (`lib/status.ts`): pending → amber, countered → **coral** (your move), active → **brand blue** (agreed, outstanding), awaiting confirmation → violet, settled → **mint** (positive terminal), declined → rose, withdrawn → neutral.

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

- Green (mint) means **settled** only; teal is the fresh accent and stays distinct from it.
- No em dashes in copy. Use periods, colons, or commas.
- No banking-table density. This is a personal ledger, not a finance console.
