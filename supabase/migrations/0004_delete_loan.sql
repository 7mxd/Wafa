-- Wafa — delete_loan: lets either party permanently remove a finished loan that
-- carries no remaining value. Same security boundary as every other write:
-- SECURITY DEFINER, empty search_path, reads auth.uid(), asserts caller-is-party
-- and a terminal status, then deletes. The loan_events rows cascade away with the
-- loan (FK `on delete cascade`, see 0001).
--
-- Only settled | declined | withdrawn qualify. Every other status still holds an
-- obligation (pending/countered await a decision, active/repaid_pending owe money),
-- so deletion is refused — the obligation must be resolved first.

create or replace function public.delete_loan(p_loan_id uuid)
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
  if v_uid not in (v_loan.borrower_id, v_loan.lender_id) then
    raise exception 'Only a party to this loan can delete it';
  end if;
  if v_loan.status not in ('settled', 'declined', 'withdrawn') then
    raise exception 'Only a settled, declined, or withdrawn loan can be deleted';
  end if;

  delete from public.loans where id = p_loan_id; -- loan_events cascade away
end;
$$;

-- A function created after 0003 needs its own grant (0003's blanket grant only
-- covered the functions that existed then).
revoke execute on function public.delete_loan(uuid) from public, anon;
grant execute on function public.delete_loan(uuid) to authenticated, service_role;
