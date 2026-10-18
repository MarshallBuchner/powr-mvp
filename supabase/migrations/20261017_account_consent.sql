-- Account-level age eligibility, legal acceptance, and optional marketing consent.
-- Credits remain server-managed; users may update only these consent columns.

alter table public.profiles
  add column if not exists age_band text;

alter table public.profiles
  add column if not exists age_confirmed_at timestamptz;

alter table public.profiles
  add column if not exists terms_version text;

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

alter table public.profiles
  add column if not exists privacy_version text;

alter table public.profiles
  add column if not exists privacy_accepted_at timestamptz;

alter table public.profiles
  add column if not exists analysis_consent_at timestamptz;

alter table public.profiles
  add column if not exists marketing_consent boolean not null default false;

alter table public.profiles
  add column if not exists marketing_consent_at timestamptz;

alter table public.profiles
  add column if not exists marketing_consent_withdrawn_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_age_band_check;

alter table public.profiles
  add constraint profiles_age_band_check
  check (age_band is null or age_band in ('teen', 'adult'));

-- Expand self-service profile updates to consent fields only (not credits).
grant update (
  email,
  display_name,
  age_band,
  age_confirmed_at,
  terms_version,
  terms_accepted_at,
  privacy_version,
  privacy_accepted_at,
  analysis_consent_at,
  marketing_consent,
  marketing_consent_at,
  marketing_consent_withdrawn_at
) on public.profiles to authenticated;
