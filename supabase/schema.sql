-- POWR assessment accounts + saved reports
-- Run in Supabase SQL editor once.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  free_assessments_used integer not null default 0,
  assessment_credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run: add entitlement columns if profiles already exists.
alter table public.profiles
  add column if not exists free_assessments_used integer not null default 0;
alter table public.profiles
  add column if not exists assessment_credits integer not null default 0;

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

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

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

-- Allow public read of a single assessment by id for share links (/r/[id]).
-- If you want private-only reports later, remove this policy.
drop policy if exists "assessments_select_public_by_id" on public.assessments;
create policy "assessments_select_public_by_id"
  on public.assessments for select
  using (true);

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

-- Atomic consume: free first (1 free), then paid credits. FOR UPDATE lock.
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

  if fre < 1 then
    fre := fre + 1;
  elsif cred > 0 then
    cred := cred - 1;
  else
    return jsonb_build_object(
      'ok', false,
      'free_assessments_used', fre,
      'assessment_credits', cred
    );
  end if;

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
  cred := greatest(cred, greatest(0, coalesce(p_credits, 0)));

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

revoke all on function public.grant_assessment_pack_credits(uuid, text, integer) from public;
grant execute on function public.grant_assessment_pack_credits(uuid, text, integer) to service_role;
