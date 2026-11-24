-- 029 — "Modalità demo rapida": 4-hour trial links for a free lesson (idempotent)
-- Run in the Supabase SQL Editor AFTER 026, 027 and 028.
--
-- * A trainer on the fitness_master plan picks one of his workout plans and
--   gets a public link (/demo/<token>) that works for 4 hours.
-- * The prospect can log sets like a real client; those logs live in
--   demo_logs, never in exercise_logs, so the real client's history is untouched.
-- * The plan gate, the 4-hour expiry and the token are enforced here:
--   the browser cannot extend a link or create one on another plan.
-- * No existing data is modified or deleted.

-- ─── 1. Tables ────────────────────────────────────────────────────────────────
create table if not exists public.demo_links (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_plan_id  uuid not null references public.workout_plans(id) on delete cascade,
  token            text not null unique
                   default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  prospect_name    text,
  message          text,
  locked_features  text[] not null default '{}',
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default now() + interval '4 hours',
  first_opened_at  timestamptz,
  open_count       int not null default 0
);
alter table public.demo_links drop constraint if exists demo_links_locked_features_check;
alter table public.demo_links add constraint demo_links_locked_features_check
  check (locked_features <@ array['weeks', 'diet', 'supplements', 'progress', 'checkin']::text[]);
alter table public.demo_links drop constraint if exists demo_links_text_length_check;
alter table public.demo_links add constraint demo_links_text_length_check
  check (coalesce(length(prospect_name), 0) <= 80 and coalesce(length(message), 0) <= 600);
create index if not exists demo_links_user_idx on public.demo_links (user_id, created_at desc);

create table if not exists public.demo_logs (
  id            uuid primary key default gen_random_uuid(),
  demo_link_id  uuid not null references public.demo_links(id) on delete cascade,
  exercise_id   text not null,
  week_number   int not null,
  weight        numeric,
  reps          text,
  note          text,
  logged_at     timestamptz not null default now(),
  unique (demo_link_id, exercise_id, week_number)
);

-- ─── 2. RLS: the trainer reads and deletes his own links ─────────────────────
alter table public.demo_links enable row level security;
alter table public.demo_logs  enable row level security;

drop policy if exists "demo_links_select_own" on public.demo_links;
drop policy if exists "demo_links_insert_own" on public.demo_links;
drop policy if exists "demo_links_delete_own" on public.demo_links;
create policy "demo_links_select_own" on public.demo_links for select using (auth.uid() = user_id);
create policy "demo_links_insert_own" on public.demo_links for insert with check (auth.uid() = user_id);
create policy "demo_links_delete_own" on public.demo_links for delete using (auth.uid() = user_id);
-- No update policy: a link cannot be extended from the browser.

drop policy if exists "demo_logs_select_own" on public.demo_logs;
create policy "demo_logs_select_own" on public.demo_logs for select using (
  exists (select 1 from public.demo_links d where d.id = demo_link_id and d.user_id = auth.uid())
);
-- Prospects write through upsert_demo_log() only.

-- ─── 3. Insert guard: plan gate, ownership, fixed 4-hour window ──────────────
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
  if not exists (select 1 from public.workout_plans w where w.id = new.workout_plan_id and w.user_id = new.user_id) then
    raise exception 'DEMO_LINK_PLAN_NOT_FOUND' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_demo_link on public.demo_links;
create trigger guard_demo_link
  before insert on public.demo_links
  for each row execute procedure public.guard_demo_link();

-- Is the link usable right now? (owner still fitness_master and active)
create or replace function public.demo_owner_ok(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.plan = 'fitness_master' from public.profiles p where p.id = p_user), false)
     and public.account_is_active(p_user);
$$;

-- ─── 4. Public read: get_demo_data(token) ────────────────────────────────────
create or replace function public.get_demo_data(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_link     public.demo_links%rowtype;
  v_plan     public.workout_plans%rowtype;
  v_trainer  text;
  v_logs     json;
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

  select * into v_plan from public.workout_plans where id = v_link.workout_plan_id;
  if v_plan.id is null then
    return json_build_object('error', 'not_found');
  end if;

  update public.demo_links
  set open_count = open_count + 1,
      first_opened_at = coalesce(first_opened_at, now())
  where id = v_link.id;

  select json_agg(row_to_json(l)) into v_logs
  from (select id, exercise_id, week_number, weight, reps, note, logged_at
        from public.demo_logs where demo_link_id = v_link.id) l;

  return json_build_object(
    'plan', json_build_object(
      'name',          v_plan.name,
      'description',   v_plan.description,
      'days_per_week', v_plan.days_per_week,
      'total_weeks',   v_plan.total_weeks,
      'exercises',     v_plan.exercises,
      'day_labels',    v_plan.day_labels
    ),
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

-- ─── 5. Public write: upsert_demo_log(token, ...) ────────────────────────────
create or replace function public.upsert_demo_log(
  p_token text, p_exercise_id text, p_week_number int,
  p_weight numeric default null, p_reps text default null, p_note text default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_link   public.demo_links%rowtype;
  v_log_id uuid;
begin
  select * into v_link from public.demo_links where token = p_token limit 1;
  if v_link.id is null then
    return json_build_object('error', 'not_found');
  end if;
  if v_link.expires_at <= now() then
    return json_build_object('error', 'expired');
  end if;
  if not public.demo_owner_ok(v_link.user_id) then
    return json_build_object('error', 'unavailable');
  end if;
  if length(p_exercise_id) > 100 or length(coalesce(p_reps, '')) > 2000 or length(coalesce(p_note, '')) > 2000 then
    return json_build_object('error', 'too_long');
  end if;
  if (select count(*) from public.demo_logs where demo_link_id = v_link.id) >= 300
     and not exists (select 1 from public.demo_logs where demo_link_id = v_link.id
                     and exercise_id = p_exercise_id and week_number = p_week_number) then
    return json_build_object('error', 'limit');
  end if;

  insert into public.demo_logs (demo_link_id, exercise_id, week_number, weight, reps, note, logged_at)
  values (v_link.id, p_exercise_id, p_week_number, p_weight, p_reps, p_note, now())
  on conflict (demo_link_id, exercise_id, week_number)
  do update set weight = excluded.weight, reps = excluded.reps, note = excluded.note, logged_at = excluded.logged_at
  returning id into v_log_id;

  return json_build_object('id', v_log_id);
end;
$$;

revoke all on function public.get_demo_data(text) from public;
revoke all on function public.upsert_demo_log(text, text, int, numeric, text, text) from public;
revoke all on function public.demo_owner_ok(uuid) from public;
grant execute on function public.get_demo_data(text) to anon, authenticated;
grant execute on function public.upsert_demo_log(text, text, int, numeric, text, text) to anon, authenticated;
