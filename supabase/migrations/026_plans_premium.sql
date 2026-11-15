-- 026 — Demo (free) vs Premium plans, approved by a super user (idempotent)
-- Run in the Supabase SQL Editor.
--
-- * No existing data is modified or deleted: accounts keep their clients,
--   plans and logs. Accounts keep the plan already stored in profiles.plan
--   ('free' unless changed by hand) until a super user approves Premium.
-- * The plan becomes server-authoritative: a trainer can no longer change
--   his own plan from the browser.
-- * Demo accounts can have at most 1 client (enforced here, not only in the UI).

-- ─── 1. Columns ───────────────────────────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('free', 'premium', 'personal_coach', 'fitness_master'));

alter table public.profiles add column if not exists premium_status text not null default 'none';
alter table public.profiles drop constraint if exists profiles_premium_status_check;
alter table public.profiles add constraint profiles_premium_status_check
  check (premium_status in ('none', 'pending', 'approved', 'rejected', 'revoked'));
alter table public.profiles add column if not exists premium_requested_at timestamptz;
alter table public.profiles add column if not exists premium_decided_at   timestamptz;
alter table public.profiles add column if not exists premium_decided_by   text;

-- Accounts created before the profile trigger existed: add the missing row.
insert into public.profiles (id, full_name, plan)
select u.id, u.raw_user_meta_data->>'full_name', 'free'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ─── 2. New accounts always start on the demo plan ────────────────────────────
-- (the old trigger copied "plan" from the sign-up metadata, which the browser controls)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, plan)
  values (new.id, new.raw_user_meta_data->>'full_name', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ─── 3. A trainer can read his profile and edit his name, never his plan ──────
drop policy if exists "profiles_owner" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.protect_profile_plan()
returns trigger language plpgsql as $$
begin
  -- Requests coming from the app (browser) cannot touch plan fields.
  -- The server (service_role) and the SQL editor can.
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.plan                 := old.plan;
    new.premium_status       := old.premium_status;
    new.premium_requested_at := old.premium_requested_at;
    new.premium_decided_at   := old.premium_decided_at;
    new.premium_decided_by   := old.premium_decided_by;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_plan on public.profiles;
create trigger protect_profile_plan
  before update on public.profiles
  for each row execute procedure public.protect_profile_plan();

-- ─── 4. Demo plan: one client ─────────────────────────────────────────────────
create or replace function public.enforce_client_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan  text;
  v_count int;
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new; -- server-side scripts and the SQL editor are not limited
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

drop trigger if exists enforce_client_limit on public.clients;
create trigger enforce_client_limit
  before insert on public.clients
  for each row execute procedure public.enforce_client_limit();

-- ─── 5. Manual approval from SQL (alternative to the /admin/premium page) ─────
-- update public.profiles set plan = 'premium', premium_status = 'approved',
--   premium_decided_at = now(), premium_decided_by = 'sql'
-- where id = (select id from auth.users where email = 'trainer@example.com');
