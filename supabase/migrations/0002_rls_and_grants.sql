-- Wafa — RLS, column-level IBAN protection, and the public_profiles view.

alter table public.profiles    enable row level security;
alter table public.loans       enable row level security;
alter table public.loan_events enable row level security;

------------------------------------------------------------------------------
-- profiles
-- Any authenticated user can see other users (for the lender picker), but ONLY
-- non-sensitive columns. IBAN is protected at the COLUMN level and is reachable
-- solely via the get_lender_iban() definer RPC (see 0003).
------------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
grant select (id, display_name, created_at) on public.profiles to authenticated;

create policy profiles_select_authenticated
  on public.profiles for select to authenticated using (true);

-- The lender-picker surface (id + display_name only). security_invoker so it
-- respects the caller's grants/RLS rather than the view owner's.
create view public.public_profiles
  with (security_invoker = true)
  as select id, display_name from public.profiles;

grant select on public.public_profiles to authenticated;

------------------------------------------------------------------------------
-- loans — readable by its two parties only; ALL writes go through definer RPCs.
------------------------------------------------------------------------------
revoke all on public.loans from anon, authenticated;
grant select on public.loans to authenticated; -- RLS gates which rows

create policy loans_select_parties
  on public.loans for select to authenticated
  using (auth.uid() in (borrower_id, lender_id));
-- No INSERT/UPDATE/DELETE policies: direct writes are denied. Transitions run
-- only via SECURITY DEFINER RPCs (0003), which bypass RLS deliberately.

------------------------------------------------------------------------------
-- loan_events — append-only audit, readable by parties to the parent loan.
------------------------------------------------------------------------------
revoke all on public.loan_events from anon, authenticated;
grant select on public.loan_events to authenticated;

create policy loan_events_select_parties
  on public.loan_events for select to authenticated
  using (
    exists (
      select 1 from public.loans l
      where l.id = loan_events.loan_id
        and auth.uid() in (l.borrower_id, l.lender_id)
    )
  );
-- No write policies: events are inserted only by the definer RPCs.
