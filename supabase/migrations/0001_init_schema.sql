-- Wafa — schema: profiles, loans (single counter-offer folded in), loan_events (audit).
-- Interest-free by design: there is deliberately NO interest/markup column anywhere.

create type public.loan_status as enum (
  'pending',
  'countered',
  'active',
  'repaid_pending',
  'settled',
  'declined',
  'withdrawn'
);

-- One row per user, 1:1 with auth.users. `iban` is sensitive (column-protected in 0002).
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  iban         text,
  created_at   timestamptz not null default now()
);

-- A single qard-hasan loan between two users. The one allowed counter-offer is folded
-- into the row (counter_*), so "single bounce" is a structural invariant, not a counter.
create table public.loans (
  id               uuid primary key default gen_random_uuid(),
  borrower_id      uuid not null references public.profiles (id) on delete cascade,
  lender_id        uuid not null references public.profiles (id) on delete cascade,
  status           public.loan_status not null default 'pending',
  amount           numeric(12,2) not null,
  currency         text not null default 'AED',
  reason           text not null,
  due_date         date,
  counter_amount   numeric(12,2),
  counter_due_date date,
  counter_note     text,
  decline_reason   text,
  ai_summary       text,
  created_at       timestamptz not null default now(),
  transferred_at   timestamptz,
  settled_at       timestamptz,
  constraint loans_borrower_ne_lender check (borrower_id <> lender_id),
  constraint loans_amount_positive check (amount > 0),
  constraint loans_counter_amount_positive check (counter_amount is null or counter_amount > 0),
  constraint loans_currency_aed check (currency = 'AED')
);

create index loans_borrower_idx on public.loans (borrower_id);
create index loans_lender_idx on public.loans (lender_id);
create index loans_status_idx on public.loans (status);

-- Append-only audit timeline. One row per transition, written atomically by the RPCs.
create table public.loan_events (
  id          uuid primary key default gen_random_uuid(),
  loan_id     uuid not null references public.loans (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  kind        text not null,
  from_status public.loan_status,
  to_status   public.loan_status not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index loan_events_loan_idx on public.loan_events (loan_id, created_at);
