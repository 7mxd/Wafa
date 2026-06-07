-- Wafa — contacts: a user's personal address book of people they can ask. It is
-- one-directional (the owner adds someone to their own list; no consent step).
-- The new-request lender picker is scoped to the owner's contacts instead of
-- every registered user. Reads are RLS-scoped to the owner; writes go through
-- definer RPCs because resolving an email needs access to auth.users.

create table public.contacts (
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id),
  constraint contacts_not_self check (owner_id <> contact_id)
);

create index contacts_owner_idx on public.contacts (owner_id, created_at);

alter table public.contacts enable row level security;

revoke all on public.contacts from anon, authenticated;
grant select on public.contacts to authenticated; -- RLS gates which rows

create policy contacts_select_owner
  on public.contacts for select to authenticated
  using (owner_id = auth.uid());
-- No INSERT/UPDATE/DELETE policy: writes run only through the RPCs below.

------------------------------------------------------------------------------
-- add_contact_by_email: resolve an email to a user and add them to the caller's
-- list. Reads auth.users (clients can't) inside the definer boundary; guards
-- empty / not-found / self / duplicate. Returns the added person's name.
------------------------------------------------------------------------------
create or replace function public.add_contact_by_email(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text;
  v_target uuid;
  v_name   text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' then raise exception 'Enter an email'; end if;

  select id into v_target from auth.users where lower(email) = v_email;
  if v_target is null then raise exception 'No one is signed up with that email'; end if;
  if v_target = v_uid then raise exception 'That is your own email'; end if;
  if exists (
    select 1 from public.contacts where owner_id = v_uid and contact_id = v_target
  ) then
    raise exception 'They are already in your list';
  end if;

  insert into public.contacts (owner_id, contact_id) values (v_uid, v_target);
  select display_name into v_name from public.profiles where id = v_target;
  return coalesce(v_name, 'Someone');
end;
$$;

------------------------------------------------------------------------------
-- remove_contact: drop someone from the caller's list.
------------------------------------------------------------------------------
create or replace function public.remove_contact(p_contact_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  delete from public.contacts where owner_id = v_uid and contact_id = p_contact_id;
end;
$$;

revoke execute on function public.add_contact_by_email(text) from public, anon;
revoke execute on function public.remove_contact(uuid) from public, anon;
grant execute on function public.add_contact_by_email(text) to authenticated, service_role;
grant execute on function public.remove_contact(uuid) to authenticated, service_role;
