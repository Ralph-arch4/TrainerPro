-- 027 — 14-day free trial, account suspension, sales leads (idempotent)
-- Run in the Supabase SQL Editor AFTER 026.
--
-- * Every demo account ("free" plan) gets a trial that ends at
--   profiles.trial_ends_at. While it runs the trainer has the full app with
--   one client (the 1-client limit stays in enforce_client_limit, mig. 026).
-- * When the trial is over and the plan is still "free" the account is
--   SUSPENDED: the trainer panel is blocked by the app, and the client links
--   (portal, logbook writes, intake forms) stop working on the server.
--   Nothing is deleted: approving Premium (or extending the trial) restores
--   everything as it was.
-- * Existing demo accounts are NOT suspended on the day this runs: they get
--   the later of "sign-up + 14 days" and TRIAL_START_FOR_EXISTING below.

-- ─── 1. Trial end date ────────────────────────────────────────────────────────
alter table public.profiles add column if not exists trial_ends_at timestamptz;

-- Backfill only rows that have no date yet (safe to re-run).
-- Existing demo accounts: at least until 2026-12-13 (the payment deadline
-- already announced in the app); change it here before running if needed.
update public.profiles p
set trial_ends_at = greatest(coalesce(p.created_at, now()) + interval '14 days', timestamptz '2026-12-13 23:59:59+01')
where p.trial_ends_at is null;

-- New accounts: trial starts at sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, plan, trial_ends_at)
  values (new.id, new.raw_user_meta_data->>'full_name', 'free', now() + interval '14 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The browser cannot extend its own trial (same rule as the plan, mig. 026).
create or replace function public.protect_profile_plan()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.plan                 := old.plan;
    new.premium_status       := old.premium_status;
    new.premium_requested_at := old.premium_requested_at;
    new.premium_decided_at   := old.premium_decided_at;
    new.premium_decided_by   := old.premium_decided_by;
    new.trial_ends_at        := old.trial_ends_at;
  end if;
  return new;
end;
$$;

-- ─── 2. Is the account active? ────────────────────────────────────────────────
-- Paid plan, or demo with the trial still running. A missing profile or a
-- missing date counts as active (never lock someone out by accident).
create or replace function public.account_is_active(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.plan <> 'free' or p.trial_ends_at is null or p.trial_ends_at > now()
     from public.profiles p where p.id = p_user),
    true);
$$;
revoke all on function public.account_is_active(uuid) from public, anon;
grant execute on function public.account_is_active(uuid) to authenticated, service_role;

-- ─── 3. Client links stop working while the trainer is suspended ─────────────
-- Same body as migration 023, plus the suspension check.
create or replace function public.get_portal_data(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan          public.workout_plans%rowtype;
  v_logs          json;
  v_diet          json;
  v_trainer_name  text;
begin
  select * into v_plan
  from public.workout_plans
  where share_token = p_token
  limit 1;

  if v_plan is null then
    return json_build_object('error', 'not_found');
  end if;

  if not public.account_is_active(v_plan.user_id) then
    return json_build_object('error', 'suspended');
  end if;

  select full_name into v_trainer_name
  from public.profiles
  where id = v_plan.user_id;

  select json_agg(row_to_json(l)) into v_logs
  from public.exercise_logs l
  where l.workout_plan_id = v_plan.id;

  select json_agg(row_to_json(d) order by d.created_at desc) into v_diet
  from public.diet_plans d
  where d.client_id = v_plan.client_id
    and d.active = true;

  return json_build_object(
    'plan', json_build_object(
      'id',            v_plan.id,
      'name',          v_plan.name,
      'description',   v_plan.description,
      'days_per_week', v_plan.days_per_week,
      'total_weeks',   v_plan.total_weeks,
      'exercises',     v_plan.exercises,
      'share_token',   v_plan.share_token,
      'client_id',     v_plan.client_id,
      'day_labels',    v_plan.day_labels,
      'supplements',   v_plan.supplements
    ),
    'logs',         coalesce(v_logs, '[]'::json),
    'diets',        coalesce(v_diet, '[]'::json),
    'trainer_name', coalesce(v_trainer_name, 'Trainer')
  );
end;
$$;
grant execute on function public.get_portal_data(text) to anon;

-- Same body as migration 012, plus the suspension check.
create or replace function public.upsert_exercise_log(
  p_token       text,
  p_exercise_id text,
  p_week_number int,
  p_weight      numeric default null,
  p_reps        text    default null,
  p_note        text    default null
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_user_id uuid;
  v_log_id  uuid;
begin
  select id, user_id into v_plan_id, v_user_id
  from public.workout_plans
  where share_token = p_token
  limit 1;

  if v_plan_id is null then
    return json_build_object('error', 'not_found');
  end if;

  if not public.account_is_active(v_user_id) then
    return json_build_object('error', 'suspended');
  end if;

  insert into public.exercise_logs
    (workout_plan_id, exercise_id, week_number, weight, reps, note, logged_at)
  values
    (v_plan_id, p_exercise_id, p_week_number, p_weight, p_reps, p_note, now())
  on conflict (workout_plan_id, exercise_id, week_number)
  do update set
    weight    = excluded.weight,
    reps      = excluded.reps,
    note      = excluded.note,
    logged_at = excluded.logged_at
  returning id into v_log_id;

  return json_build_object('id', v_log_id);
end;
$$;
grant execute on function public.upsert_exercise_log(text, text, int, numeric, text, text) to anon;

-- ─── 4. Suspended trainers cannot add clients (the panel is blocked in the
--        app too; this closes the direct-API path) ────────────────────────────
create or replace function public.enforce_client_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan  text;
  v_count int;
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new; -- server-side scripts and the SQL editor are not limited
  end if;
  if not public.account_is_active(new.user_id) then
    raise exception 'ACCOUNT_SUSPENDED' using errcode = 'P0001',
      hint = 'The free trial has ended. Contact sales to activate Premium.';
  end if;
  select plan into v_plan from public.profiles where id = new.user_id;
  if coalesce(v_plan, 'free') <> 'free' then
    return new;
  end if;
  select count(*) into v_count
  from public.clients c
  where c.user_id = new.user_id
    and (to_jsonb(c)->>'deleted_at') is null;
  if v_count >= 1 then
    raise exception 'DEMO_CLIENT_LIMIT' using errcode = 'P0001',
      hint = 'The demo plan allows one client. Upgrade to Premium.';
  end if;
  return new;
end;
$$;

-- ─── 5. Sales leads from the public "contact sales" form ──────────────────────
-- Written only by the server (/api/contact, service role); read on /admin/premium.
create table if not exists public.sales_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  clients     text,
  message     text,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.sales_leads enable row level security;
-- No policies: anon/authenticated cannot read or write; service_role bypasses RLS.

-- ─── 6. Manual actions (alternative to /admin/premium) ────────────────────────
-- Extend a trial by 14 days:
-- update public.profiles set trial_ends_at = now() + interval '14 days'
-- where id = (select id from auth.users where email = 'trainer@example.com');
