-- Preserve all existing balances. Only restrict how new paid credits are granted.
begin;

-- Users may edit profile details, but credit columns are server-managed.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, email, display_name) on public.profiles to authenticated;
grant update (email, display_name) on public.profiles to authenticated;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id and free_assessments_used = 0 and assessment_credits = 0);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.merge_assessment_entitlement(
  p_free_used integer,
  p_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  fre integer;
  cred integer;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id)
  values (uid)
  on conflict (id) do nothing;

  select free_assessments_used, assessment_credits
    into fre, cred
    from public.profiles
   where id = uid
   for update;

  fre := greatest(fre, greatest(0, coalesce(p_free_used, 0)));
  -- Never import paid credits from untrusted browser/device state.
  -- Keep p_credits in the signature for backwards compatibility.

  update public.profiles
     set free_assessments_used = fre,
         assessment_credits = cred,
         updated_at = now()
   where id = uid;

  return jsonb_build_object(
    'ok', true,
    'free_assessments_used', fre,
    'assessment_credits', cred
  );
end;
$$;

revoke all on function public.merge_assessment_entitlement(integer, integer) from public;
grant execute on function public.merge_assessment_entitlement(integer, integer) to authenticated;


revoke all on function public.grant_assessment_pack_credits(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.grant_assessment_pack_credits(uuid, text, integer) to service_role;

commit;
