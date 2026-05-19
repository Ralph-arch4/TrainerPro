-- 020_cv_security.sql
-- Three additions:
--  1. body_features JSONB on fitness_scans (stores TF.js pose keypoints + derived metrics)
--  2. photo_access_pins — per-trainer DB-backed PIN (replaces hardcoded "admin 1")
--  3. photo_view_tokens — single-use, expiring tokens for secure photo delivery

-- ─── 1. CV body features ─────────────────────────────────────────────────────
-- Populated client-side by TF.js MoveNet after upload; never re-computed.
-- Schema matches BodyFeatures interface in lib/cv-analysis.ts.

alter table fitness_scans
  add column if not exists body_features jsonb;

comment on column fitness_scans.body_features is
  'TF.js MoveNet pose keypoints + derived body metrics (SHR, WHR, symmetry).
   Computed client-side on upload — zero API cost for basic analysis.';

-- ─── 2. Photo access PINs ────────────────────────────────────────────────────
-- Each trainer sets their own PIN. Stored as SHA-256(salt || PIN).
-- The plaintext PIN is never persisted anywhere.

create table if not exists photo_access_pins (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  pin_hash    text        not null,   -- hex(SHA-256(salt || PIN))
  pin_salt    text        not null,   -- random UUID generated once
  updated_at  timestamptz not null default now()
);

alter table photo_access_pins enable row level security;

create policy "trainer_manages_own_pin"
  on photo_access_pins for all
  using (auth.uid() = user_id);

-- ─── 3. Photo view tokens ────────────────────────────────────────────────────
-- Single-use tokens issued before each photo load.
-- After the image renders the token is marked used — URL cannot be replayed.
-- TTL: 90 seconds (enough to load; too short to share).

create table if not exists photo_view_tokens (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  resource    text        not null,   -- storage path (never exposed to client)
  bucket      text        not null,   -- 'Trainer Progress Bar' or 'fitness-scans'
  token_hash  text        not null unique,  -- SHA-256 of the opaque token sent to client
  used        boolean     not null default false,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table photo_view_tokens enable row level security;

-- Trainers can manage tokens for their own resources.
-- Service-role is used for all writes from API routes.
create policy "trainer_manages_view_tokens"
  on photo_view_tokens for all
  using (auth.uid() = user_id);

create index if not exists pvt_token_hash_idx  on photo_view_tokens(token_hash);
create index if not exists pvt_expires_at_idx  on photo_view_tokens(expires_at);
create index if not exists pvt_user_id_idx     on photo_view_tokens(user_id);

comment on table photo_view_tokens is
  'Single-use tokens for progress photos and fitness scan images.
   Each token is issued per-resource, single-use, 90s TTL.
   After image loads the client calls POST /api/photo/view-token?id=X to mark it used.
   Expired/used tokens are rejected — URL replay is impossible.';

-- ─── Cleanup helper ───────────────────────────────────────────────────────────
-- Deletes tokens older than 1 hour (safety net for unused expired tokens).
-- Call from a Supabase pg_cron job: SELECT cleanup_expired_view_tokens();

create or replace function cleanup_expired_view_tokens()
returns void
language sql
security definer
as $$
  delete from photo_view_tokens
  where expires_at < now() - interval '1 hour';
$$;
