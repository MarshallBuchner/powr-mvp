-- POWR: persisted analysis results + idempotent replay for /api/analyze.
-- Safe to apply at any time; the app degrades gracefully until it exists.
create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  owner_user_id uuid references auth.users (id) on delete cascade,
  device_key_hash text,
  report jsonb,
  share_token text references public.shared_reports (share_token) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists analysis_results_owner_user_id_idx
  on public.analysis_results (owner_user_id);
create index if not exists analysis_results_created_at_idx
  on public.analysis_results (created_at);

-- Service role only: RLS on with no policies; revoke direct client access.
alter table public.analysis_results enable row level security;
revoke all on table public.analysis_results from anon, authenticated;
