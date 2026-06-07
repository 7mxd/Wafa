-- Wafa — fuller payment details. Adds optional bank fields to profiles. They are
-- sensitive, so they inherit the existing column-level protection automatically:
-- 0002 grants clients SELECT on only (id, display_name, created_at), so any new
-- column is unreadable to clients and reachable solely through definer RPCs.
--
-- This migration is ADDITIVE on purpose. The IBAN-only RPCs (get_lender_iban from
-- 0003, set_iban / get_my_iban from 0005) are superseded by the *_payment_details
-- functions below but left in place so an already-deployed build keeps working;
-- they can be dropped in a follow-up once the new code is live.

alter table public.profiles
  add column if not exists account_holder_name text,
  add column if not exists bank_name           text,
  add column if not exists account_number      text,
  add column if not exists swift_bic            text;

------------------------------------------------------------------------------
-- set_payment_details: write/clear the caller's details. Normalizes the IBAN
-- (strip spaces, uppercase) with a structural guard; the full mod-97 checksum is
-- validated in the app layer. Empty strings clear a field.
------------------------------------------------------------------------------
create or replace function public.set_payment_details(
  p_iban                text default null,
  p_account_holder_name text default null,
  p_bank_name           text default null,
  p_account_number      text default null,
  p_swift_bic           text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_iban text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  v_iban := nullif(upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g')), '');
  if v_iban is not null and v_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$' then
    raise exception 'That does not look like a valid IBAN';
  end if;

  update public.profiles set
    iban                = v_iban,
    account_holder_name = nullif(trim(coalesce(p_account_holder_name, '')), ''),
    bank_name           = nullif(trim(coalesce(p_bank_name, '')), ''),
    account_number      = nullif(trim(coalesce(p_account_number, '')), ''),
    swift_bic           = nullif(upper(trim(coalesce(p_swift_bic, ''))), '')
  where id = v_uid;
end;
$$;

------------------------------------------------------------------------------
-- get_my_payment_details: the caller's own details (columns unreadable to clients).
------------------------------------------------------------------------------
create or replace function public.get_my_payment_details()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  return (
    select to_jsonb(t) from (
      select iban, account_holder_name, bank_name, account_number, swift_bic
      from public.profiles where id = v_uid
    ) t
  );
end;
$$;

------------------------------------------------------------------------------
-- get_lender_payment_details: the lender's details, to the borrower, on an active
-- loan only. Supersedes get_lender_iban.
------------------------------------------------------------------------------
create or replace function public.get_lender_payment_details(p_loan_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_loan public.loans;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select * into v_loan from public.loans where id = p_loan_id;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.borrower_id <> v_uid then raise exception 'Only the borrower may view these details'; end if;
  if v_loan.status not in ('active', 'repaid_pending') then
    raise exception 'Payment details are available only on an active loan';
  end if;
  return (
    select to_jsonb(t) from (
      select iban, account_holder_name, bank_name, account_number, swift_bic
      from public.profiles where id = v_loan.lender_id
    ) t
  );
end;
$$;

revoke execute on function public.set_payment_details(text, text, text, text, text) from public, anon;
revoke execute on function public.get_my_payment_details() from public, anon;
revoke execute on function public.get_lender_payment_details(uuid) from public, anon;
grant execute on function public.set_payment_details(text, text, text, text, text) to authenticated, service_role;
grant execute on function public.get_my_payment_details() to authenticated, service_role;
grant execute on function public.get_lender_payment_details(uuid) to authenticated, service_role;
