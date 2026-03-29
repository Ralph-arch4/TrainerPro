# TrainerPro — CLAUDE.md

## Project Overview
CRM e gestione clienti per personal trainer indipendenti per gestire schede, diete e fasi di allenamento.
Industry: Fitness / Bodybuilding
UI Language: Italian

## Tech Stack
- Next.js 15 App Router (TypeScript)
- Supabase Auth + PostgreSQL (RLS enabled)
- Zustand with persist middleware
- Tailwind CSS 4
- Stripe: not included (can be added)
- Deployed on Vercel: https://trainer-pro-phi.vercel.app

## Architecture Decisions
- Auth: PKCE flow via @supabase/ssr. Password recovery redirects to /reset-password
  directly (NOT via /auth/callback). exchangeCodeForSession runs client-side.
- State: Zustand is the source of truth for UI. Supabase is the source of truth for
  persistence. Always update Zustand optimistically, then sync to Supabase.
- DB writes: Always use lib/db.ts functions, never raw Supabase calls in components.
- Plan limits: Check limits via lib/plan-limits.ts checkLimit() before any create action.

## Primary Entity: Client
## Secondary Entities: WorkoutPlan, Phase, DietPlan, BodyMeasurement, Note

## Pricing Tiers
- Free — €0 — max 1 cliente
- Personal Coach — €29/mese — max 15 clienti
- Fitness Master Customized — prezzo personalizzato — clienti illimitati

## Color Palette
- Accent:       #FF6B2B
- Accent Light: #FF9A6C
- Accent Dark:  #CC4A0A
- Background:   #0A0A0A

## CSS Classes (from globals.css)
- `.accent-text`  — gradient text in accent color
- `.accent-btn`   — primary CTA button
- `.glass`        — frosted glass card
- `.glass-dark`   — darker frosted glass (sidebar, modals)
- `.card-luxury`  — dark elevated card
- `.fade-in`      — entrance animation

## Key Patterns

### Adding a new dashboard page
1. Create `app/dashboard/[page]/page.tsx`
2. Add nav item to `components/AppNav.tsx`
3. Read from Zustand store, write via `lib/db.ts`
4. Check plan limits before create actions

### Plan gating
```typescript
const { allowed, message } = checkLimit(user.plan, "clients", clients.length);
if (!allowed) { /* show upgrade modal */ return; }
```

### Optimistic update pattern
```typescript
store.addClient(newClient);                    // Instant UI update
try { await dbClients.create(payload); }      // Persist to Supabase
catch { store.removeClient(tempId); }         // Rollback on failure
```

### Client status values
- `attivo` — active client
- `in_pausa` — on hold
- `inattivo` — inactive

### Phase types
- `bulk` — Massa / Bulk
- `cut` — Definizione / Cut
- `maintenance` — Mantenimento
- `custom` — Personalizzata
