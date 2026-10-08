-- POWR assessment accounts + saved reports
-- Run in Supabase SQL editor once.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  free_assessments_used integer not null default 0,
  assessment_credits integer not null default 0,
  founding_activated_at timestamptz,
  founding_expires_at timestamptz,
  founding_month_key text,
  founding_month_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run: add entitlement columns if profiles already exists.
alter table public.profiles
  add column if not exists free_assessments_used integer not null default 0;
alter table public.profiles
  add column if not exists assessment_credits integer not null default 0;
alter table public.profiles
  add column if not exists founding_activated_at timestamptz;
alter table public.profiles
  add column if not exists founding_expires_at timestamptz;
alter table public.profiles
  add column if not exists founding_month_key text;
alter table public.profiles
  add column if not exists founding_month_used integer not null default 0;

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  goal text not null,
  file_name text not null,
  duration numeric,
  analysis jsonb not null,
  overall_score integer
);

create index if not exists assessments_user_id_created_at_idx
  on public.assessments (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

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

drop policy if exists "assessments_select_own" on public.assessments;
create policy "assessments_select_own"
  on public.assessments for select
  using (auth.uid() = user_id);

drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_insert_own"
  on public.assessments for insert
  with check (auth.uid() = user_id);

drop policy if exists "assessments_delete_own" on public.assessments;
create policy "assessments_delete_own"
  on public.assessments for delete
  using (auth.uid() = user_id);

-- Reports are private by default. Public viewing uses tokenized shared_reports
-- via the Next.js service-role API (/r/s/[token]). Do NOT re-add a world-readable
-- assessments SELECT policy.
drop policy if exists "assessments_select_public_by_id" on public.assessments;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Idempotent Stripe pack grants (webhook source of truth).
create table if not exists public.assessment_credit_grants (
  stripe_session_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now()
);

create index if not exists assessment_credit_grants_user_id_idx
  on public.assessment_credit_grants (user_id);

alter table public.assessment_credit_grants enable row level security;

-- Users can see their own grant history; only service role inserts via RPC.
drop policy if exists "credit_grants_select_own" on public.assessment_credit_grants;
create policy "credit_grants_select_own"
  on public.assessment_credit_grants for select
  using (auth.uid() = user_id);

-- Service-role only: activate Founding Athlete once (never resets window).
create or replace function public.activate_founding_athlete(
  p_user_id uuid,
  p_months integer default 6
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  fre integer;
  cred integer;
  f_act timestamptz;
  f_exp timestamptz;
  f_key text;
  f_used integer;
  month_key text;
  was_active boolean;
begin
  if p_user_id is null then
    raise exception 'invalid_user';
  end if;

  if p_months is null or p_months < 1 or p_months > 24 then
    raise exception 'invalid_months';
  end if;

  insert into public.profiles (id)
  values (p_user_id)
  on conflict (id) do nothing;

  select free_assessments_used, assessment_credits,
         founding_activated_at, founding_expires_at,
         founding_month_key, founding_month_used
    into fre, cred, f_act, f_exp, f_key, f_used
    from public.profiles
   where id = p_user_id
   for update;

  was_active := f_act is not null;
  month_key := to_char((now() at time zone 'America/Edmonton'), 'YYYY-MM');

  if not was_active then
    f_act := now();
    f_exp := f_act + make_interval(months => p_months);
    f_key := coalesce(f_key, month_key);
    f_used := coalesce(f_used, 0);

    update public.profiles
       set founding_activated_at = f_act,
           founding_expires_at = f_exp,
           founding_month_key = f_key,
           founding_month_used = f_used,
           updated_at = now()
     where id = p_user_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'already_activated', was_active,
    'founding_activated_at', f_act,
    'founding_expires_at', f_exp,
    'founding_month_key', coalesce(f_key, month_key),
    'founding_month_used', coalesce(f_used, 0),
    'free_assessments_used', coalesce(fre, 0),
    'assessment_credits', coalesce(cred, 0)
  );
end;
$$;

revoke all on function public.activate_founding_athlete(uuid, integer) from public, anon, authenticated;
grant execute on function public.activate_founding_athlete(uuid, integer) to service_role;

-- Atomic consume: founding monthly → free → paid credits. FOR UPDATE lock.
create or replace function public.consume_assessment_credit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  fre integer;
  cred integer;
  f_act timestamptz;
  f_exp timestamptz;
  f_key text;
  f_used integer;
  month_key text;
  consumed_from text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id)
  values (uid)
  on conflict (id) do nothing;

  select free_assessments_used, assessment_credits,
         founding_activated_at, founding_expires_at,
         founding_month_key, founding_month_used
    into fre, cred, f_act, f_exp, f_key, f_used
    from public.profiles
   where id = uid
   for update;

  month_key := to_char((now() at time zone 'America/Edmonton'), 'YYYY-MM');

  if f_key is distinct from month_key then
    f_key := month_key;
    f_used := 0;
  end if;

  consumed_from := null;

  if f_act is not null
     and f_exp is not null
     and f_exp > now()
     and f_used < 20 then
    f_used := f_used + 1;
    consumed_from := 'founding';
  elsif fre < 1 then
    fre := fre + 1;
    consumed_from := 'free';
  elsif cred > 0 then
    cred := cred - 1;
    consumed_from := 'paid';
  else
    update public.profiles
       set founding_month_key = f_key,
           founding_month_used = f_used,
           updated_at = now()
     where id = uid;

    return jsonb_build_object(
      'ok', false,
      'free_assessments_used', fre,
      'assessment_credits', cred,
      'founding_activated_at', f_act,
      'founding_expires_at', f_exp,
      'founding_month_key', f_key,
      'founding_month_used', f_used
    );
  end if;

  update public.profiles
     set free_assessments_used = fre,
         assessment_credits = cred,
         founding_month_key = f_key,
         founding_month_used = f_used,
         updated_at = now()
   where id = uid;

  return jsonb_build_object(
    'ok', true,
    'consumed_from', consumed_from,
    'free_assessments_used', fre,
    'assessment_credits', cred,
    'founding_activated_at', f_act,
    'founding_expires_at', f_exp,
    'founding_month_key', f_key,
    'founding_month_used', f_used
  );
end;
$$;

revoke all on function public.consume_assessment_credit() from public;
grant execute on function public.consume_assessment_credit() to authenticated;

-- Idempotent merge: profile := greatest(profile, device) on free used + credits.
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

-- Service-role only: grant pack credits once per Stripe Checkout session.
create or replace function public.grant_assessment_pack_credits(
  p_user_id uuid,
  p_session_id text,
  p_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.assessment_credit_grants%rowtype;
  fre integer;
  cred integer;
begin
  if p_user_id is null or p_session_id is null or p_credits is null or p_credits <= 0 then
    raise exception 'invalid_grant_args';
  end if;

  select * into existing
    from public.assessment_credit_grants
   where stripe_session_id = p_session_id;

  if found then
    select free_assessments_used, assessment_credits
      into fre, cred
      from public.profiles
     where id = existing.user_id;

    return jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'credits_granted', existing.credits,
      'free_assessments_used', coalesce(fre, 0),
      'assessment_credits', coalesce(cred, 0)
    );
  end if;

  insert into public.profiles (id)
  values (p_user_id)
  on conflict (id) do nothing;

  insert into public.assessment_credit_grants (stripe_session_id, user_id, credits)
  values (p_session_id, p_user_id, p_credits);

  update public.profiles
     set assessment_credits = assessment_credits + p_credits,
         updated_at = now()
   where id = p_user_id
   returning free_assessments_used, assessment_credits into fre, cred;

  return jsonb_build_object(
    'ok', true,
    'already_granted', false,
    'credits_granted', p_credits,
    'free_assessments_used', fre,
    'assessment_credits', cred
  );
exception
  when unique_violation then
    select * into existing
      from public.assessment_credit_grants
     where stripe_session_id = p_session_id;

    select free_assessments_used, assessment_credits
      into fre, cred
      from public.profiles
     where id = existing.user_id;

    return jsonb_build_object(
      'ok', true,
      'already_granted', true,
      'credits_granted', existing.credits,
      'free_assessments_used', coalesce(fre, 0),
      'assessment_credits', coalesce(cred, 0)
    );
end;
$$;

revoke all on function public.grant_assessment_pack_credits(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.grant_assessment_pack_credits(uuid, text, integer) to service_role;

-- Tokenized share links (guest drafts + optional saved-assessment shares).
create table if not exists public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  share_token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  owner_user_id uuid references auth.users (id) on delete cascade,
  assessment_id uuid references public.assessments (id) on delete cascade,
  goal text not null,
  file_name text not null,
  duration numeric,
  analysis jsonb not null
);

create index if not exists shared_reports_owner_user_id_idx
  on public.shared_reports (owner_user_id);

create index if not exists shared_reports_assessment_id_idx
  on public.shared_reports (assessment_id);

alter table public.shared_reports enable row level security;

drop policy if exists "shared_reports_select_own" on public.shared_reports;
create policy "shared_reports_select_own"
  on public.shared_reports for select to authenticated
  using (auth.uid() = owner_user_id);

drop policy if exists "shared_reports_update_own" on public.shared_reports;
create policy "shared_reports_update_own"
  on public.shared_reports for update to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "shared_reports_delete_own" on public.shared_reports;
create policy "shared_reports_delete_own"
  on public.shared_reports for delete to authenticated
  using (auth.uid() = owner_user_id);

revoke insert, update, delete on public.shared_reports from anon, authenticated;
grant select on public.shared_reports to authenticated;
grant update (revoked_at) on public.shared_reports to authenticated;
grant delete on public.shared_reports to authenticated;
