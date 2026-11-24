-- 030 — Demo rapida: the plan lives inside the link and can be edited (idempotent)
-- Run in the Supabase SQL Editor AFTER 029_quick_demo_links.sql.
--
-- * A trainer can build the trial plan in a few minutes directly in the demo
--   panel (name, days, exercises, sets, reps), without creating a client first.
-- * Links can still point to an existing workout plan (029 behaviour).
-- * The trainer can edit an active link's plan; token, owner and the 4-hour
--   expiry stay locked.
-- * No existing data is modified or deleted.

-- ─── 1. Inline plan columns ───────────────────────────────────────────────────
alter table public.demo_links alter column workout_plan_id drop not null;
alter table public.demo_links add column if not exists plan_name     text;
alter table public.demo_links add column if not exists exercises     jsonb;
alter table public.demo_links add column if not exists days_per_week int;
alter table public.demo_links add column if not exists day_labels    jsonb;

alter table public.demo_links drop constraint if exists demo_links_plan_source_check;
alter table public.demo_links add constraint demo_links_plan_source_check
  check (workout_plan_id is not null or exercises is not null);
alter table public.demo_links drop constraint if exists demo_links_inline_plan_check;
alter table public.demo_links add constraint demo_links_inline_plan_check
  check (
    coalesce(length(plan_name), 0) <= 120
    and (exercises is null or (jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) <= 80
                               and length(exercises::text) <= 60000))
    and (days_per_week is null or days_per_week between 1 and 7)
    and (day_labels is null or length(day_labels::text) <= 2000)
  );

-- ─── 2. Insert guard: ownership check only when a saved plan is used ─────────
create or replace function public.guard_demo_link()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.user_id         := auth.uid();
    new.token           := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    new.created_at      := now();
    new.expires_at      := now() + interval '4 hours';
    new.first_opened_at := null;
    new.open_count      := 0;
  end if;

  select plan into v_plan from public.profiles where id = new.user_id;
  if coalesce(v_plan, 'free') <> 'fitness_master' then
    raise exception 'DEMO_LINK_PLAN_REQUIRED' using errcode = 'P0001',
      hint = 'Quick demo links are a fitness_master feature.';
  end if;
  if not public.account_is_active(new.user_id) then
    raise exception 'DEMO_LINK_ACCOUNT_INACTIVE' using errcode = 'P0001';
  end if;
  if new.workout_plan_id is not null
     and not exists (select 1 from public.workout_plans w where w.id = new.workout_plan_id and w.user_id = new.user_id) then
    raise exception 'DEMO_LINK_PLAN_NOT_FOUND' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ─── 3. Editing: only the content, never token / owner / expiry ──────────────
-- SECURITY INVOKER on purpose: current_user is 'authenticated' for requests
-- from the app, and the function owner inside get_demo_data (open_count).
create or replace function public.guard_demo_link_update()
returns trigger language plpgsql set search_path = public as $$
declare
  v_plan text;
begin
  if current_user in ('authenticated', 'anon') then
    new.id              := old.id;
    new.user_id         := old.user_id;
    new.token           := old.token;
    new.created_at      := old.created_at;
    new.expires_at      := old.expires_at;
    new.first_opened_at := old.first_opened_at;
    new.open_count      := old.open_count;
    new.workout_plan_id := old.workout_plan_id;
    select plan into v_plan from public.profiles where id = old.user_id;
    if coalesce(v_plan, 'free') <> 'fitness_master' then
      raise exception 'DEMO_LINK_PLAN_REQUIRED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_demo_link_update on public.demo_links;
create trigger guard_demo_link_update
  before update on public.demo_links
  for each row execute procedure public.guard_demo_link_update();

drop policy if exists "demo_links_update_own" on public.demo_links;
create policy "demo_links_update_own" on public.demo_links for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── 4. Public read: inline plan or saved plan ────────────────────────────────
create or replace function public.get_demo_data(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_link     public.demo_links%rowtype;
  v_plan     public.workout_plans%rowtype;
  v_trainer  text;
  v_logs     json;
  v_plan_json json;
begin
  select * into v_link from public.demo_links where token = p_token limit 1;
  if v_link.id is null then
    return json_build_object('error', 'not_found');
  end if;
  if not public.demo_owner_ok(v_link.user_id) then
    return json_build_object('error', 'unavailable');
  end if;

  select full_name into v_trainer from public.profiles where id = v_link.user_id;

  if v_link.expires_at <= now() then
    return json_build_object(
      'error',         'expired',
      'trainer_name',  coalesce(v_trainer, 'Trainer'),
      'prospect_name', v_link.prospect_name,
      'message',       v_link.message
    );
  end if;

  if v_link.workout_plan_id is not null then
    select * into v_plan from public.workout_plans where id = v_link.workout_plan_id;
    if v_plan.id is null then
      return json_build_object('error', 'not_found');
    end if;
    v_plan_json := json_build_object(
      'name',          v_plan.name,
      'description',   v_plan.description,
      'days_per_week', v_plan.days_per_week,
      'total_weeks',   v_plan.total_weeks,
      'exercises',     v_plan.exercises,
      'day_labels',    v_plan.day_labels
    );
  else
    v_plan_json := json_build_object(
      'name',          coalesce(nullif(v_link.plan_name, ''), 'Lezione di prova'),
      'description',   null,
      'days_per_week', coalesce(v_link.days_per_week, 1),
      'total_weeks',   1,
      'exercises',     coalesce(v_link.exercises, '[]'::jsonb),
      'day_labels',    v_link.day_labels
    );
  end if;

  update public.demo_links
  set open_count = open_count + 1,
      first_opened_at = coalesce(first_opened_at, now())
  where id = v_link.id;

  select json_agg(row_to_json(l)) into v_logs
  from (select id, exercise_id, week_number, weight, reps, note, logged_at
        from public.demo_logs where demo_link_id = v_link.id) l;

  return json_build_object(
    'plan',            v_plan_json,
    'logs',            coalesce(v_logs, '[]'::json),
    'trainer_name',    coalesce(v_trainer, 'Trainer'),
    'prospect_name',   v_link.prospect_name,
    'message',         v_link.message,
    'locked_features', to_json(v_link.locked_features),
    'expires_at',      v_link.expires_at,
    'server_now',      now()
  );
end;
$$;

revoke all on function public.get_demo_data(text) from public;
grant execute on function public.get_demo_data(text) to anon, authenticated;
