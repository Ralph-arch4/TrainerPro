# TrainerPro — CLAUDE.md
> v3.0 — Compressed knowledge doc. DO NOT re-read files documented here.

---

## 1. PROJECT SYNOPSIS

**What:** CRM SaaS for Italian personal trainers. PT manages clients, workout plans, diet plans, phases (bulk/cut), measurements, notes. Clients access via shared link.

**Stack:** Next.js 15 App Router + TypeScript | Supabase Auth + PostgreSQL (RLS) | Zustand (persist) | Tailwind CSS 4 | Vercel

**Prod:** https://trainer-pro-phi.vercel.app | **Repo:** github.com/Ralph-arch4/TrainerPro (`master`)

### Architecture (5 lines)
```
Browser -> Next.js (App Router) -> Zustand (optimistic) -> lib/db.ts -> Supabase
Auth: PKCE via @supabase/ssr. Password reset -> /reset-password (client-side exchangeCodeForSession)
RLS: every table has policy on user_id. workout_plans: public read via share_token.
State: Zustand = UI source of truth. Supabase = persistence source of truth.
Always: update Zustand first -> sync DB -> rollback on error.
```

### DB Schema
```sql
clients(id, user_id, name, email, phone, birth_date, goal, level, status, monthly_fee, start_date, avatar)
workout_plans(id, client_id, user_id, name, exercises JSONB, share_token, day_labels JSONB, supplements JSONB, rest_seconds, days_per_week, total_weeks, active)
exercise_logs(id, workout_plan_id, exercise_id TEXT, week_number INT, weight NUMERIC, reps TEXT, note TEXT, logged_at)
  -> reps: "12/10/8" (legacy) or JSON "[{r:'12',w:'80'},...]" (per-set with weights)
diet_plans(id, client_id, calories, calories_max, protein, protein_max, carbs, carbs_max, fat, fat_max, meals TEXT JSON, active)
phases(id, client_id, name, type, start_date, end_date, target_calories, target_weight, completed)
body_measurements(id, client_id, date, weight, body_fat, chest, waist, hips, arms, legs)
intake_forms(id, trainer_id, token, label, status, response JSONB, submitted_at)
```

### Critical files
| File | Role |
|------|------|
| `lib/store.ts` | TS types + Zustand store (see type summary below) |
| `lib/db.ts` | All Supabase calls (camelCase<->snake_case). NEVER raw calls in components. |
| `lib/exerciseLibrary.ts` | 110+ Italian exercises. `searchExercises(q, muscleGroup?)` |
| `lib/plan-limits.ts` | `checkLimit(plan, "clients", count)`, `isPremium`, `FREE_CLIENT_LIMIT` -- tier gating |
| `lib/foodDatabase.ts` | 75 Italian foods, per-100g macros. `searchFoods(q)`, `getFood(id)`, `macrosFor(food, g)` |
| `components/SupabaseDataLoader.tsx` | Loads all data at mount (logs, supplements). Has `dataLoaded` flag. |
| `components/WorkoutLogbook.tsx` | Card grid view, per-set logging, supplements |
| `components/WorkoutSpreadsheet.tsx` | Table view: add/edit/reorder exercises + autocomplete |
| `components/DietPlanEditor.tsx` | "Indicazioni alimentari" editor: foods + free-text `portion`, optional orientative macro ranges, exports `DIET_DISCLAIMER` |
| `app/dashboard/clienti/[id]/page.tsx` | Client detail (plans, diet, phases, measurements, notes) |
| `app/dashboard/clienti/[id]/schede/[planId]/page.tsx` | PT plan view: toggle Logbook/Spreadsheet |
| `components/ClientPortal.tsx` | Client portal: plan only (no gamification). Used by `app/cliente/[token]` and `app/scheda/[token]`. Trainer notes/links rendered via `LinkifiedText` |
| `lib/exerciseImages.ts` | Exercise name -> guide photos in `public/exercises/<id>/{0,1}.webp` (free-exercise-db, public domain) |
| `app/api/intake/[token]/route.ts` | Server-side API with service_role key |
| `lib/progressions.ts` | Pre-planned progressions: `applyProgression(ex, week)`, `normalizeProgressions`, `moveWithinDay`. Stored in `exercise.progressions[]` (JSONB, no migration). Edited via `components/ProgressionEditor.tsx` |
| `lib/billing.ts` + `components/PaymentNotice.tsx` | Payment reminder pop-up for `plan === "free"`; due date = user metadata `payment_due_at` or `PAYMENT_NOTICE_START` + 30 days |
| `lib/brand.ts`, `app/manifest.ts`, `public/sw.js`, `android/twa-manifest.json` | PWA / Play Store (TWA). Steps in `docs/PLAY_STORE.md` |
| `app/dashboard/account/page.tsx` + `app/api/account/delete/route.ts` | Account page + self-service account deletion (service_role) |
| `app/dashboard/demo-rapida` + `components/DemoPortal.tsx` (`/demo/[token]`) + `lib/quickDemo.ts` | "Demo rapida": 4h free-lesson link, `fitness_master` only. Migration 029: `demo_links` (trigger forces token/4h expiry/plan gate), `demo_logs` (separate from exercise_logs), RPCs `get_demo_data`, `upsert_demo_log` |

### store.ts type summary (avoid loading 360-line file)
| Type | Key fields |
|------|-----------|
| `User` | id, name, email, plan: PlanTier, premiumStatus?, wantsPremium? |
| `Exercise` | id, name, muscleGroup?, sets, targetReps, perSetReps?, restSeconds?, day, order, supersetGroup?, videoUrl?, kind? (strength/cardio/core), duration?, intensity? |
| `MealItem` | id, name, portion? (free text), notes?; grams/gramsMax/macros = legacy, never shown or saved |
| `Meal` | id, name, time?, items: MealItem[] |
| `ExerciseLog` | id, exerciseId, weekNumber, weight?, reps?, note?, loggedAt |
| `Phase` | id, clientId, name, type: bulk/cut/maintenance/custom, startDate, endDate, targetCalories?, completed |
| `SupplementItem` | id, name, brand?, productUrl?, discountCode?, notes? |
| `WorkoutPlan` | id, clientId, name, daysPerWeek, totalWeeks, restSeconds?, exercises[], logs[], shareToken, active, dayLabels?, supplements? |
| `DietPlan` | id, clientId, calories, caloriesMax?, protein, proteinMax?, carbs, carbsMax?, fat, fatMax?, meals (JSON string), active |
| `BodyMeasurement` | id, clientId, date, weight, bodyFat?, chest?, waist?, hips?, arms?, legs? |
| `Note` | id, clientId, content, createdAt, updatedAt |
| `Client` | id, userId, name, email, status, monthlyFee?, startDate, workoutPlans[], phases[], dietPlans[], measurements[], notes[] |

**Store actions** (all on `useAppStore`): setUser, clearUser, setActiveClient, setAllClients, addClient, updateClient, removeClient, addWorkoutPlan, updateWorkoutPlan, removeWorkoutPlan, addExercise, updateExercise, removeExercise, reorderExercises, upsertLog, removeLog, addPhase, updatePhase, removePhase, addDietPlan, updateDietPlan, removeDietPlan, addMeasurement, updateMeasurement, removeMeasurement, addNote, updateNote, removeNote

### Tiering
Demo (`plan = "free"`): 1 client | Premium (any other plan value): unlimited, full app.
- Source of truth: `profiles.plan` + `premium_status` (migration 026). Never read/write the plan from user metadata or from the browser; DB triggers block self-upgrade and the 2nd client on demo (`DEMO_CLIENT_LIMIT`)
- UI rules: `lib/plan-limits.ts` (`isPremium`, `checkLimit`). Price/payment details: env vars in `lib/billing.ts`
- Flow: register (two paths, `intended_plan` metadata) -> `/dashboard/abbonamento` -> `POST /api/premium/request` (pending) -> super user approves on `/admin/premium` (`/api/admin/premium`, admin role in `public.user_roles`, service_role via `lib/supabase/admin.ts`)
- CEO admin panel `/admin` (trainer list, `/admin/trainer/[id]` detail with clients/activity/notes, `/admin/contatti`, `/admin/registro`): APIs `app/api/admin/*` all via `adminGuard()` (role `admin` in `public.user_roles`, migration 028; `SUPERUSER_EMAILS` optional fallback; also drives `is_platform_admin()`). Actions validated in `lib/admin-actions.ts`. Migration 028: `profiles.account_status` (active/suspended/banned, browser can't change it), `paid_until`, `admin_trainer_notes`, `admin_audit_log`; extends `account_is_active()` (027) so suspended/banned block panel and client links. Ban also sets Supabase Auth `ban_duration`
- Android app (TWA): no payment links/IBAN in-app (`lib/platform.ts` `isAndroidApp`), Google Play billing policy

### Palette
Accent: `#C9A84C` (gold) | Light: `#E8C96B` | Dark: `#8B6820` | BG: `#080808`
Classes: `.accent-text`, `.accent-btn`, `.glass`, `.glass-dark`, `.card-luxury`, `.fade-in`, `.outline-btn`, `.scrollbar-hide`

---

## 2. CODING CONVENTIONS

**UI language:** Italian (all labels, messages, placeholders) | **Code language:** English (vars, functions, comments)
**No emoji** in code or responses unless explicitly requested
**Short responses** -- no post-action summaries, user sees the diff

```typescript
// Naming: camelCase for TS/JS, snake_case for DB columns (mapped in lib/db.ts)
// Components: PascalCase, always "use client" if using hooks
// Never dynamic Tailwind classes: NOT "grid-cols-${n}" -> use explicit ternaries
// Optimistic: update Zustand first, sync DB after, rollback on error
// No raw Supabase in components: always via lib/db.ts
// Env: NEXT_PUBLIC_* for client-side, no prefix for server-only
// SUPABASE_SERVICE_ROLE_KEY: never in tracked files, only .env.local (gitignored)
```

**db.ts camelCase->snake_case pattern:** Each update() function manually maps fields. Convention: `const mapped: Record<string, unknown> = {}; if (payload.fieldName !== undefined) mapped.field_name = payload.fieldName;`
> PENDING USER APPROVAL: Abstract into `mapFields(payload, fieldMap)` utility to eliminate ~90 lines of repeated mapping across 6 update() functions.

**Per-set log encoding:**
```typescript
reps: JSON.stringify([{r:"12",w:"80"},{r:"10",w:"75"}])
// Parse: try JSON.parse -> if Array with .r -> map; else splitLegacy(log)
```

**uid() in db.ts:** Calls `auth.getUser()` on every write (1 extra round-trip per DB mutation).
> PENDING USER APPROVAL: Refactor to pass userId as parameter from caller. Risk: must verify RLS policies remain intact.

### Tool workflow
- File search: Glob or Grep directly (NOT Agent for simple lookups)
- Broad exploration: Agent subagent_type=Explore
- Editing: always Edit (never sed/awk/echo redirect)
- Build check: `npx next build 2>&1 | tail -30` in background
- Git: `pull --rebase` before push if rejected
- PowerShell and Bash pre-approved: `.claude/settings.json` allows `Bash(*)` and `PowerShell(*)` — run terminal commands without asking permission

---

## 3. ORCHESTRATION PATTERN

### Model selection decision tree
```
Task type?
  Research / ideation / UI components   -> Sonnet (fast, cheap)
  Synthesis / architecture / DB-touching -> Opus (powerful, precise)
  Classification / routing only          -> Haiku (ultra-fast)
```

### Fan-in / fan-out
```
Orchestrator (Sonnet) -> [Agent A | Agent B | Agent C] (Sonnet, parallel)
                      -> Opus (synthesis + implementation)
                      -> Orchestrator (verify + CLAUDE.md update)
```

### Sub-agent context template
```
ROLE: [one sentence]
TASK: [specific deliverable]
STACK: Next.js 15 + Supabase + Zustand + Tailwind 4
CONSTRAINTS: [2-3 bullets]
OUTPUT FORMAT: [structured format]
```
Never pre-paste file contents > 50 lines into sub-agent prompts. Let them Glob/Read.

### Failure heuristic
Reject sub-agent output if: < 80 words OR no concrete file path/identifier cited.

Fan-out only when genuinely multi-perspective; use Glob/Grep directly for single-file lookups.

---

## 4. LAB NOTES -- ERRORS TO AVOID

- git push rejected -> `git pull --rebase origin master` first
- Tailwind dynamic classes purged -> use explicit ternaries (see section 2)
- Service role key: never in tracked files; Vercel env changes require manual redeploy
- JWT secret rotation = forced logout for all users; prefer new API keys
- Migration 008 (supplements): apply manually in Supabase SQL Editor if not done
- `weight` on exercise_logs is NUMERIC -- for per-set weights, encode in `reps` TEXT as JSON
- `meals` on diet_plans is TEXT (not JSONB): always `JSON.stringify()` before saving
- After adding new DB column, update SupabaseDataLoader `.select("*")` if specific filtering needed
- No Agent for simple searches (Glob/Grep are 10x faster)
- CLAUDE.md length directly reduces context cache advantage -- keep dense

- Never `overflow-x: hidden` on both html and body (iOS scroll lock): body uses `overflow-x: clip`
- `.card-luxury` has no backdrop blur on touch/mobile (scroll performance); hover effects only under `@media (hover: hover)`
- Components that call hooks after an early return must be mounted behind a guard (see `ClientDetailPage` -> `ClientDetail`)
- Reorder exercises with `moveWithinDay` (per-day swap), never by global `order` index

### Testing
- `npm test` -- unit tests (node:test, no deps): progressions, billing, exercise image matching
- `npm run test:e2e` -- Playwright against `next start` with mocked Supabase; build first with `NEXT_PUBLIC_SUPABASE_URL=https://e2e-test.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key`

- REMOVED for compliance (do not re-add without legal review): client progress photos, AI Fitness Scan (Anthropic/TensorFlow), `lib/cv-analysis`, `lib/physique-analyzer`, `lib/tier-system`, `/api/fitness-scan/*`, `/api/photo/*`. Cleanup SQL: migration 025
- Intake form collects health data: submit requires the explicit consent checkbox (`privacyConsentAt` stored in the response)
- Diets are "Indicazioni alimentari" (legal: no gram prescriptions, no auto-generator, never call them "dieta"/"piano alimentare"); show `DIET_DISCLAIMER` wherever they are edited or displayed
- App name only via `lib/brand.ts` (`APP_NAME`); never hardcode it in UI strings
- No credentials in scripts; hosting/DB production checklist in `docs/INFRASTRUTTURA.md`

### Confirmed patterns
- Client sessions (start/end/duration/feedback) = exercise_logs rows with `exercise_id = "session:<day>"` (lib/workoutSession.ts); SupabaseDataLoader splits them into `plan.sessionLogs`. Client per-exercise feedback = `log.note`. PT reads both in client detail tab "Feedback"
- Per-set log in `reps` TEXT as JSON `[{r,w}]` -- no DB migration needed
- `parseJsonb<T>(value, fallback)` in SupabaseDataLoader for string-or-object JSONB
- `run_in_background: true` for `next build` -- non-blocking
- Parallel tool calls in same message for independent operations

---

*Last updated: 2026-11-15 -- Session: demo/Premium plans with super-user approval, Play Store listing assets*
