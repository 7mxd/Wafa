-- Wafa — security & state-machine verification. Run against the seeded DB.
-- Returns one row per assertion; every `passed` should be true.

drop table if exists _wafa_test;
create temp table _wafa_test (name text, passed boolean, detail text);

do $$
declare
  aisha text := '11111111-1111-1111-1111-111111111111';
  omar  text := '22222222-2222-2222-2222-222222222222';
  fake  text := '99999999-9999-9999-9999-999999999999';
  v_txt text; v_cnt int; v_amt numeric; v_status text;
begin
  -- Guard: borrower cannot approve (wrong party)
  begin
    perform set_config('request.jwt.claims', '{"sub":"'||aisha||'","role":"authenticated"}', true);
    perform public.approve_loan('00000000-0000-0000-0000-0000000000a1');
    insert into _wafa_test values ('guard: borrower cannot approve', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('guard: borrower cannot approve', position('Only the lender' in sqlerrm) > 0, sqlerrm);
  end;

  -- Guard: confirm requires repaid_pending (wrong status)
  begin
    perform set_config('request.jwt.claims', '{"sub":"'||omar||'","role":"authenticated"}', true);
    perform public.confirm_settled('00000000-0000-0000-0000-0000000000a1');
    insert into _wafa_test values ('guard: confirm requires repaid_pending', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('guard: confirm requires repaid_pending', position('awaiting confirmation' in sqlerrm) > 0, sqlerrm);
  end;

  -- Single-bounce: cannot counter an already-countered loan
  begin
    perform set_config('request.jwt.claims', '{"sub":"'||omar||'","role":"authenticated"}', true);
    perform public.counter_loan('00000000-0000-0000-0000-0000000000a2', 700, current_date + 12, 'again');
    insert into _wafa_test values ('single-bounce: cannot counter twice', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('single-bounce: cannot counter twice', position('not pending' in sqlerrm) > 0, sqlerrm);
  end;

  -- IBAN positive: borrower on an active loan
  begin
    perform set_config('request.jwt.claims', '{"sub":"'||aisha||'","role":"authenticated"}', true);
    v_txt := public.get_lender_iban('00000000-0000-0000-0000-0000000000a3');
    insert into _wafa_test values ('iban: borrower+active returns IBAN', v_txt = 'AE120030000012345678901', coalesce(v_txt,'(null)'));
  exception when others then
    insert into _wafa_test values ('iban: borrower+active returns IBAN', false, sqlerrm);
  end;

  -- IBAN guard: non-borrower denied
  begin
    perform set_config('request.jwt.claims', '{"sub":"'||omar||'","role":"authenticated"}', true);
    perform public.get_lender_iban('00000000-0000-0000-0000-0000000000a3');
    insert into _wafa_test values ('iban: non-borrower denied', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('iban: non-borrower denied', position('Only the borrower' in sqlerrm) > 0, sqlerrm);
  end;

  -- IBAN guard: pre-active denied
  begin
    perform set_config('request.jwt.claims', '{"sub":"'||aisha||'","role":"authenticated"}', true);
    perform public.get_lender_iban('00000000-0000-0000-0000-0000000000a1');
    insert into _wafa_test values ('iban: pre-active denied', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('iban: pre-active denied', position('active loan' in sqlerrm) > 0, sqlerrm);
  end;

  -- accept_counter copies counter terms (throwaway loan, cleaned up)
  begin
    insert into public.loans (id, borrower_id, lender_id, status, amount, reason, due_date, counter_amount, counter_due_date)
    values ('cccccccc-cccc-cccc-cccc-cccccccccccc', aisha::uuid, omar::uuid, 'countered', 900, 'tmp', current_date + 5, 600, current_date + 10);
    perform set_config('request.jwt.claims', '{"sub":"'||aisha||'","role":"authenticated"}', true);
    perform public.accept_counter('cccccccc-cccc-cccc-cccc-cccccccccccc');
    select amount, status::text into v_amt, v_status from public.loans where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    insert into _wafa_test values ('accept_counter copies terms -> active', v_amt = 600 and v_status = 'active', format('amount=%s status=%s', v_amt, v_status));
    delete from public.loan_events where loan_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    delete from public.loans where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  exception when others then
    delete from public.loan_events where loan_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    delete from public.loans where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    insert into _wafa_test values ('accept_counter copies terms -> active', false, sqlerrm);
  end;

  -- Audit: settled loan has exactly 4 events
  select count(*) into v_cnt from public.loan_events where loan_id = '00000000-0000-0000-0000-0000000000a5';
  insert into _wafa_test values ('audit: settled loan has 4 events', v_cnt = 4, format('events=%s', v_cnt));

  -- RLS: a non-party sees zero loans
  begin
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims', '{"sub":"'||fake||'","role":"authenticated"}', true);
    select count(*) into v_cnt from public.loans;
    execute 'reset role';
    insert into _wafa_test values ('rls: non-party sees 0 loans', v_cnt = 0, format('saw %s', v_cnt));
  exception when others then
    insert into _wafa_test values ('rls: non-party sees 0 loans', false, sqlerrm);
  end;

  -- Column: authenticated cannot read profiles.iban directly
  begin
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims', '{"sub":"'||aisha||'","role":"authenticated"}', true);
    perform iban from public.profiles where id = aisha::uuid;
    execute 'reset role';
    insert into _wafa_test values ('column: iban not directly selectable', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('column: iban not directly selectable', position('permission denied' in lower(sqlerrm)) > 0, sqlerrm);
  end;

  -- Direct write: authenticated cannot UPDATE loans
  begin
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims', '{"sub":"'||omar||'","role":"authenticated"}', true);
    update public.loans set status = 'settled' where id = '00000000-0000-0000-0000-0000000000a1';
    execute 'reset role';
    insert into _wafa_test values ('write: direct UPDATE loans denied', false, 'no exception');
  exception when others then
    insert into _wafa_test values ('write: direct UPDATE loans denied', position('permission denied' in lower(sqlerrm)) > 0, sqlerrm);
  end;
end $$;

select name, passed, detail from _wafa_test order by name;
