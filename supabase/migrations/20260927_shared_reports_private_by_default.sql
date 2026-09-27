-- Launch-readiness: private reports by default + tokenized sharing.
-- Run in Supabase SQL editor after deploy (idempotent).

-- 1) Remove world-readable assessment SELECT (UUID enumeration risk).
drop policy if exists "assessments_select_public_by_id" on public.assessments;

-- 2) Tokenized share table (guest drafts + optional saved-assessment shares).
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

-- Owners can see their own share rows (for revoke UI). Public reads go through
-- the service-role API by token — no anon SELECT policy on purpose.
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

-- Inserts are performed by the Next.js service role (guest drafts + create share).
revoke insert, update, delete on public.shared_reports from anon, authenticated;
grant select on public.shared_reports to authenticated;
grant update (revoked_at) on public.shared_reports to authenticated;
grant delete on public.shared_reports to authenticated;
