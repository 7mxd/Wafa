-- Wafa — transition RPCs (the security boundary), profile bootstrap trigger, and
-- the IBAN access RPC. Every transition function is SECURITY DEFINER, pins an empty
-- search_path, reads auth.uid() internally, asserts caller-role + exact current
-- status, then performs the UPDATE and the loan_events INSERT atomically.

------------------------------------------------------------------------------
-- Profile bootstrap: create a profiles row whenever an auth user is created.
------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------
-- create_loan: ∅ -> pending (borrower opens a request to a lender)
------------------------------------------------------------------------------
create or replace function public.create_loan(
  p_lender_id  uuid,
  p_amount     numeric,
  p_reason     text,
  p_due_date   date default null,
  p_ai_summary text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan_id uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if p_lender_id is null or p_lender_id = v_uid then
    raise exception 'Choose a lender other than yourself';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'A reason is required'; end if;
  if not exists (select 1 from public.profiles where id = p_lender_id) then
    raise exception 'Lender not found';
  end if;

  insert into public.loans (borrower_id, lender_id, amount, reason, due_date, ai_summary)
  values (v_uid, p_lender_id, round(p_amount, 2), trim(p_reason), p_due_date, p_ai_summary)
  returning id into v_loan_id;

  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status)
  values (v_loan_id, v_uid, 'requested', null, 'pending');

  return v_loan_id;
end;
$$;

------------------------------------------------------------------------------
-- approve_loan: pending -> active (lender)
------------------------------------------------------------------------------
create or replace function public.approve_loan(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.lender_id <> v_uid then raise exception 'Only the lender can approve'; end if;
  if v_loan.status <> 'pending' then raise exception 'Loan is not pending'; end if;

  update public.loans set status = 'active' where id = p_loan_id;
  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status)
  values (p_loan_id, v_uid, 'approved', 'pending', 'active');
end;
$$;

------------------------------------------------------------------------------
-- counter_loan: pending -> countered (lender; single bounce, must change a term)
------------------------------------------------------------------------------
create or replace function public.counter_loan(
  p_loan_id        uuid,
  p_counter_amount numeric,
  p_counter_due_date date default null,
  p_counter_note   text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.lender_id <> v_uid then raise exception 'Only the lender can counter'; end if;
  if v_loan.status <> 'pending' then raise exception 'Loan is not pending'; end if;
  if p_counter_amount is null or p_counter_amount <= 0 then
    raise exception 'Counter amount must be positive';
  end if;
  if round(p_counter_amount, 2) = v_loan.amount
     and p_counter_due_date is not distinct from v_loan.due_date then
    raise exception 'A counter must change the amount or the due date';
  end if;

  update public.loans
    set status = 'countered',
        counter_amount = round(p_counter_amount, 2),
        counter_due_date = p_counter_due_date,
        counter_note = nullif(trim(p_counter_note), '')
    where id = p_loan_id;

  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status, note)
  values (p_loan_id, v_uid, 'countered', 'pending', 'countered', nullif(trim(p_counter_note), ''));
end;
$$;

------------------------------------------------------------------------------
-- decline_loan: pending -> declined (lender)
------------------------------------------------------------------------------
create or replace function public.decline_loan(
  p_loan_id        uuid,
  p_decline_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.lender_id <> v_uid then raise exception 'Only the lender can decline'; end if;
  if v_loan.status <> 'pending' then raise exception 'Loan is not pending'; end if;

  update public.loans
    set status = 'declined', decline_reason = nullif(trim(p_decline_reason), '')
    where id = p_loan_id;
  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status, note)
  values (p_loan_id, v_uid, 'declined', 'pending', 'declined', nullif(trim(p_decline_reason), ''));
end;
$$;

------------------------------------------------------------------------------
-- withdraw_loan: pending|countered -> withdrawn (borrower)
------------------------------------------------------------------------------
create or replace function public.withdraw_loan(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.borrower_id <> v_uid then raise exception 'Only the borrower can withdraw'; end if;
  if v_loan.status not in ('pending', 'countered') then
    raise exception 'Only a pending or countered request can be withdrawn';
  end if;

  update public.loans set status = 'withdrawn' where id = p_loan_id;
  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status)
  values (p_loan_id, v_uid, 'withdrawn', v_loan.status, 'withdrawn');
end;
$$;

------------------------------------------------------------------------------
-- accept_counter: countered -> active (borrower; counter terms become the loan)
------------------------------------------------------------------------------
create or replace function public.accept_counter(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.borrower_id <> v_uid then raise exception 'Only the borrower can accept the counter'; end if;
  if v_loan.status <> 'countered' then raise exception 'Loan is not countered'; end if;

  update public.loans
    set status = 'active',
        amount = v_loan.counter_amount,
        due_date = v_loan.counter_due_date
    where id = p_loan_id;
  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status)
  values (p_loan_id, v_uid, 'counter_accepted', 'countered', 'active');
end;
$$;

------------------------------------------------------------------------------
-- mark_transferred: active -> repaid_pending (borrower says "I've transferred")
------------------------------------------------------------------------------
create or replace function public.mark_transferred(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.borrower_id <> v_uid then raise exception 'Only the borrower can mark the transfer'; end if;
  if v_loan.status <> 'active' then raise exception 'Loan is not active'; end if;

  update public.loans set status = 'repaid_pending', transferred_at = now() where id = p_loan_id;
  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status)
  values (p_loan_id, v_uid, 'marked_repaid', 'active', 'repaid_pending');
end;
$$;

------------------------------------------------------------------------------
-- confirm_settled: repaid_pending -> settled (lender confirms receipt)
------------------------------------------------------------------------------
create or replace function public.confirm_settled(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.lender_id <> v_uid then raise exception 'Only the lender can confirm receipt'; end if;
  if v_loan.status <> 'repaid_pending' then raise exception 'Loan is not awaiting confirmation'; end if;

  update public.loans set status = 'settled', settled_at = now() where id = p_loan_id;
  insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status)
  values (p_loan_id, v_uid, 'confirmed_settled', 'repaid_pending', 'settled');
end;
$$;

------------------------------------------------------------------------------
-- get_lender_iban: the ONLY path to a lender's IBAN. Borrower-only, active loans.
------------------------------------------------------------------------------
create or replace function public.get_lender_iban(p_loan_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
  v_iban text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.borrower_id <> v_uid then raise exception 'Only the borrower may view the lender IBAN'; end if;
  if v_loan.status not in ('active', 'repaid_pending') then
    raise exception 'IBAN is available only on an active loan';
  end if;
  select iban into v_iban from public.profiles where id = v_loan.lender_id;
  return v_iban;
end;
$$;

------------------------------------------------------------------------------
-- Execution lockdown: only authenticated/service_role may call public functions.
-- (public has only our functions; pgcrypto etc. live in the extensions schema.)
------------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
