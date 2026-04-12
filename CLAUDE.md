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
| `lib/plan-limits.ts` | `checkLimit(plan, "clients", count)` -- tier gating |
| `components/SupabaseDataLoader.tsx` | Loads all data at mount (logs, supplements). Has `dataLoaded` flag. |
| `components/WorkoutLogbook.tsx` | Card grid view, per-set logging, supplements |
| `components/WorkoutSpreadsheet.tsx` | Table view: add/edit/reorder exercises + autocomplete |
| `components/DietPlanEditor.tsx` | Full-screen diet editor with macro ranges |
| `app/dashboard/clienti/[id]/page.tsx` | Client detail (plans, diet, phases, measurements, notes) |
| `app/dashboard/clienti/[id]/schede/[planId]/page.tsx` | PT plan view: toggle Logbook/Spreadsheet |
| `app/cliente/[token]/page.tsx` | Client portal: Workout + Diet + Supplements tabs |
| `app/scheda/[token]/page.tsx` | Public shared plan link (WorkoutLogbook client mode) |
| `app/api/intake/[token]/route.ts` | Server-side API with service_role key |

### store.ts type summary (avoid loading 360-line file)
| Type | Key fields |
|------|-----------|
| `User` | id, name, email, plan: PlanTier |
| `Exercise` | id, name, muscleGroup?, sets, targetReps, perSetReps?, restSeconds?, day, order, supersetGroup?, videoUrl? |
| `MealItem` | id, name, grams, gramsMax?, protein/carbs/fat/calories? |
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
Free: 1 client | Personal Coach (EUR29/mo): 15 | Fitness Master: unlimited

### Palette
Accent: `#FF6B2B` | Light: `#FF9A6C` | Dark: `#CC4A0A` | BG: `#0A0A0A`
Classes: `.accent-text`, `.accent-btn`, `.glass`, `.glass-dark`, `.card-luxury`, `.fade-in`

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

### Confirmed patterns
- Per-set log in `reps` TEXT as JSON `[{r,w}]` -- no DB migration needed
- `parseJsonb<T>(value, fallback)` in SupabaseDataLoader for string-or-object JSONB
- `run_in_background: true` for `next build` -- non-blocking
- Parallel tool calls in same message for independent operations

---

*Last updated: 2026-04-12 -- Session: Token optimization + CLAUDE.md v3 compression*
