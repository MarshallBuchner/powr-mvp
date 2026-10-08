-- Founding Athlete complimentary access (6 months, 20 assessments / calendar month).
-- Idempotent. Does not alter Stripe grants, paid credits, or shared_reports.
-- Activation is service_role only; monthly consume is atomic via FOR UPDATE.

begin;

alter table public.profiles
  add column if not exists founding_activated_at timestamptz;

alter table public.profiles
  add column if not exists founding_expires_at timestamptz;

alter table public.profiles
  add column if not exists founding_month_key text;

alter table public.profiles
  add column if not exists founding_month_used integer not null default 0;

-- Service-role only: link entitlement to a verified user id once.
-- Never resets activated_at / expires_at on subsequent calls.
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
  month_key := to_char((now() at time zone 'America/Toronto'), 'YYYY-MM');

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
-- Ordinary customers (no founding activation) keep the production free→paid path:
-- same FOR UPDATE lock, same column updates on success, no write on empty failure.
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
  founding_live boolean;
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

  month_key := to_char((now() at time zone 'America/Toronto'), 'YYYY-MM');
  founding_live := f_act is not null and f_exp is not null and f_exp > now();
  consumed_from := null;

  if founding_live then
    if f_key is distinct from month_key then
      f_key := month_key;
      f_used := 0;
    end if;

    if f_used < 20 then
      f_used := f_used + 1;
      consumed_from := 'founding';
    end if;
  end if;

  if consumed_from is null then
    if fre < 1 then
      fre := fre + 1;
      consumed_from := 'free';
    elsif cred > 0 then
      cred := cred - 1;
      consumed_from := 'paid';
    else
      -- Empty balance. Persist founding month rollover only when founding is live.
      if founding_live then
        update public.profiles
           set founding_month_key = f_key,
               founding_month_used = f_used,
               updated_at = now()
         where id = uid;
      end if;

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
  end if;

  if founding_live or f_act is not null then
    update public.profiles
       set free_assessments_used = fre,
           assessment_credits = cred,
           founding_month_key = f_key,
           founding_month_used = f_used,
           updated_at = now()
     where id = uid;
  else
    -- Production-compatible update for ordinary customers.
    update public.profiles
       set free_assessments_used = fre,
           assessment_credits = cred,
           updated_at = now()
     where id = uid;
  end if;

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

commit;
