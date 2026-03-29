-- TrainerPro — Initial Schema
-- Run this in the Supabase SQL Editor (idempotent — safe to re-run)

-- ─── User profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  plan       text not null default 'free' check (plan in ('free', 'personal_coach', 'fitness_master')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, plan)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'plan', 'free'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Clients ──────────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  email       text,
  phone       text,
  birth_date  date,
  goal        text check (goal in ('dimagrimento', 'massa', 'tonificazione', 'performance')),
  level       text check (level in ('principiante', 'intermedio', 'avanzato')),
  status      text not null default 'attivo' check (status in ('attivo', 'inattivo', 'in_pausa')),
  monthly_fee numeric(10,2),
  start_date  date,
  avatar      text,
  created_at  timestamptz default now()
);

alter table public.clients enable row level security;
drop policy if exists "clients_owner" on public.clients;
create policy "clients_owner" on public.clients for all using (auth.uid() = user_id);

-- ─── Phases ───────────────────────────────────────────────────────────────────
create table if not exists public.phases (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid references public.clients(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete cascade not null,
  name             text not null,
  type             text not null check (type in ('bulk', 'cut', 'maintenance', 'custom')),
  start_date       date not null,
  end_date         date not null,
  target_calories  integer,
  target_weight    numeric(5,2),
  completed        boolean not null default false,
  notes            text,
  created_at       timestamptz default now()
);

alter table public.phases enable row level security;
drop policy if exists "phases_owner" on public.phases;
create policy "phases_owner" on public.phases for all using (auth.uid() = user_id);

-- ─── Workout Plans ────────────────────────────────────────────────────────────
create table if not exists public.workout_plans (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references public.clients(id) on delete cascade not null,
  user_id       uuid references auth.users(id) on delete cascade not null,
  phase_id      uuid references public.phases(id) on delete set null,
  name          text not null,
  description   text,
  days_per_week integer not null default 3,
  exercises     jsonb,
  active        boolean not null default true,
  created_at    timestamptz default now()
);

alter table public.workout_plans enable row level security;
drop policy if exists "workout_plans_owner" on public.workout_plans;
create policy "workout_plans_owner" on public.workout_plans for all using (auth.uid() = user_id);

-- ─── Diet Plans ───────────────────────────────────────────────────────────────
create table if not exists public.diet_plans (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.clients(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  phase_id   uuid references public.phases(id) on delete set null,
  name       text not null,
  calories   integer not null,
  protein    numeric(6,1) not null,
  carbs      numeric(6,1) not null,
  fat        numeric(6,1) not null,
  meals      jsonb,
  notes      text,
  active     boolean not null default true,
  created_at timestamptz default now()
);

alter table public.diet_plans enable row level security;
drop policy if exists "diet_plans_owner" on public.diet_plans;
create policy "diet_plans_owner" on public.diet_plans for all using (auth.uid() = user_id);

-- ─── Body Measurements ────────────────────────────────────────────────────────
create table if not exists public.body_measurements (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.clients(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  date       date not null,
  weight     numeric(5,2) not null,
  body_fat   numeric(5,2),
  chest      numeric(5,1),
  waist      numeric(5,1),
  hips       numeric(5,1),
  arms       numeric(5,1),
  legs       numeric(5,1),
  notes      text,
  created_at timestamptz default now()
);

alter table public.body_measurements enable row level security;
drop policy if exists "body_measurements_owner" on public.body_measurements;
create policy "body_measurements_owner" on public.body_measurements for all using (auth.uid() = user_id);

-- ─── Notes ────────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.clients(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;
drop policy if exists "notes_owner" on public.notes;
create policy "notes_owner" on public.notes for all using (auth.uid() = user_id);
