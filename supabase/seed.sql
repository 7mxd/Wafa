-- Wafa — demo seed: two test accounts + loans across every status.
-- Run after the migrations (0001–0006). Idempotent for users; loans are reset.
-- Test accounts: aisha@wafa.test / omar@wafa.test, password "Wafa-demo-1".

-- 1) Auth users (GoTrue email/password) + identities. Trigger creates profiles.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'aisha@wafa.test',
   extensions.crypt('Wafa-demo-1', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Aisha"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'omar@wafa.test',
   extensions.crypt('Wafa-demo-1', extensions.gen_salt('bf')),
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Omar"}', '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"aisha@wafa.test","email_verified":true,"phone_verified":false}',
   'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"omar@wafa.test","email_verified":true,"phone_verified":false}',
   'email', now(), now(), now())
on conflict do nothing;

-- Payment details for the demo accounts (IBAN normalized: no spaces, uppercase).
update public.profiles set iban = 'AE070331234567890123456',
  account_holder_name = 'Aisha Rahman', bank_name = 'Emirates NBD'
  where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set iban = 'AE120030000012345678901',
  account_holder_name = 'Omar Haddad', bank_name = 'Abu Dhabi Commercial Bank'
  where id = '22222222-2222-2222-2222-222222222222';

-- Contacts: each demo user keeps the other in their personal list, so the
-- new-request picker is populated for both.
insert into public.contacts (owner_id, contact_id) values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

-- 2) Loans across every status + matching audit timelines (dates relative to today).
delete from public.loan_events where loan_id in (select id from public.loans);
delete from public.loans;

insert into public.loans
  (id, borrower_id, lender_id, status, amount, reason, due_date,
   counter_amount, counter_due_date, counter_note, decline_reason,
   ai_summary, created_at, transferred_at, settled_at) values
  ('00000000-0000-0000-0000-0000000000a1','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
   'pending', 500, 'Car repair before the weekend', current_date + 14, null,null,null,null,
   'Interest-free qard hasan: AED 500 for a car repair, due in 2 weeks. No profit, no markup.',
   now() - interval '2 hours', null, null),
  ('00000000-0000-0000-0000-0000000000a2','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
   'countered', 1200, 'Flight tickets home', current_date + 25, 800, current_date + 30,
   'Can do 800 now, sort the rest later inshallah', null,
   'Interest-free qard hasan: AED 1,200 for flights, due in ~3 weeks.',
   now() - interval '1 day', null, null),
  ('00000000-0000-0000-0000-0000000000a3','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
   'active', 750, 'Laptop screen repair', current_date + 19, null,null,null,null,
   'Interest-free qard hasan: AED 750 for a laptop repair, due in ~3 weeks.',
   now() - interval '3 days', null, null),
  ('00000000-0000-0000-0000-0000000000a4','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
   'repaid_pending', 200, 'Team dinner I hosted', current_date + 4, null,null,null,null,
   'Interest-free qard hasan: AED 200 for a team dinner, due in 4 days.',
   now() - interval '5 days', now() - interval '6 hours', null),
  ('00000000-0000-0000-0000-0000000000a5','22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',
   'settled', 1000, 'Apartment deposit', current_date - 17, null,null,null,null,
   'Interest-free qard hasan: AED 1,000 for an apartment deposit.',
   now() - interval '25 days', now() - interval '19 days', now() - interval '18 days'),
  ('00000000-0000-0000-0000-0000000000a6','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
   'declined', 5000, 'New phone', current_date + 30, null,null,null,'A bit much for me right now — sorry!',
   'Interest-free qard hasan: AED 5,000 for a new phone.',
   now() - interval '7 days', null, null),
  ('00000000-0000-0000-0000-0000000000a7','22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',
   'withdrawn', 400, 'Concert ticket', current_date + 6, null,null,null,null,
   'Interest-free qard hasan: AED 400 for a concert ticket.',
   now() - interval '10 days', null, null);

insert into public.loan_events (loan_id, actor_id, kind, from_status, to_status, note, created_at) values
  ('00000000-0000-0000-0000-0000000000a1','11111111-1111-1111-1111-111111111111','requested',null,'pending',null, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-0000000000a2','11111111-1111-1111-1111-111111111111','requested',null,'pending',null, now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000a2','22222222-2222-2222-2222-222222222222','countered','pending','countered','Can do 800 now, sort the rest later inshallah', now() - interval '20 hours'),
  ('00000000-0000-0000-0000-0000000000a3','11111111-1111-1111-1111-111111111111','requested',null,'pending',null, now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000a3','22222222-2222-2222-2222-222222222222','approved','pending','active',null, now() - interval '2 days 20 hours'),
  ('00000000-0000-0000-0000-0000000000a4','11111111-1111-1111-1111-111111111111','requested',null,'pending',null, now() - interval '5 days'),
  ('00000000-0000-0000-0000-0000000000a4','22222222-2222-2222-2222-222222222222','approved','pending','active',null, now() - interval '4 days 22 hours'),
  ('00000000-0000-0000-0000-0000000000a4','11111111-1111-1111-1111-111111111111','marked_repaid','active','repaid_pending',null, now() - interval '6 hours'),
  ('00000000-0000-0000-0000-0000000000a5','22222222-2222-2222-2222-222222222222','requested',null,'pending',null, now() - interval '25 days'),
  ('00000000-0000-0000-0000-0000000000a5','11111111-1111-1111-1111-111111111111','approved','pending','active',null, now() - interval '24 days'),
  ('00000000-0000-0000-0000-0000000000a5','22222222-2222-2222-2222-222222222222','marked_repaid','active','repaid_pending',null, now() - interval '19 days'),
  ('00000000-0000-0000-0000-0000000000a5','11111111-1111-1111-1111-111111111111','confirmed_settled','repaid_pending','settled',null, now() - interval '18 days'),
  ('00000000-0000-0000-0000-0000000000a6','11111111-1111-1111-1111-111111111111','requested',null,'pending',null, now() - interval '7 days'),
  ('00000000-0000-0000-0000-0000000000a6','22222222-2222-2222-2222-222222222222','declined','pending','declined','A bit much for me right now — sorry!', now() - interval '6 days 23 hours'),
  ('00000000-0000-0000-0000-0000000000a7','22222222-2222-2222-2222-222222222222','requested',null,'pending',null, now() - interval '10 days'),
  ('00000000-0000-0000-0000-0000000000a7','22222222-2222-2222-2222-222222222222','withdrawn','pending','withdrawn',null, now() - interval '9 days');
