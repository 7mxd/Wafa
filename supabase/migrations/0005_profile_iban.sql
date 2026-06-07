-- Wafa — let a user manage their OWN IBAN. profiles.iban is column-protected
-- (no client SELECT, see 0002), so reads go through get_my_iban and writes
-- through set_iban. Same security boundary as every other write: SECURITY
-- DEFINER, empty search_path, reads auth.uid(), scoped to the caller's row.

-- set_iban: write/clear the caller's IBAN. Normalizes (strip spaces, uppercase)
-- and applies a structural guard; the full mod-97 checksum is validated in the
-- app layer before this is called. An empty value clears it.
create or replace function public.set_iban(p_iban text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_norm text;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  v_norm := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));

  if v_norm = '' then
    update public.profiles set iban = null where id = v_uid;
    return;
  end if;

  if v_norm !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$' then
    raise exception 'That does not look like a valid IBAN';
  end if;

  update public.profiles set iban = v_norm where id = v_uid;
end;
$$;

-- get_my_iban: the caller's own IBAN (the column is unreadable to clients).
create or replace function public.get_my_iban()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  return (select iban from public.profiles where id = v_uid);
end;
$$;

revoke execute on function public.set_iban(text) from public, anon;
revoke execute on function public.get_my_iban() from public, anon;
grant execute on function public.set_iban(text) to authenticated, service_role;
grant execute on function public.get_my_iban() to authenticated, service_role;
