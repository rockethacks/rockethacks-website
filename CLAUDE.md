# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RocketHacks is a hackathon event management platform. It serves four distinct user types through a single Next.js app:
- **Applicants** — apply, RSVP, check in, view status at `/dashboard`
- **Judges** — score projects at `/judge`
- **Organizers** — manage staff and tasks at `/organizer`
- **Admins** — full access at `/admin`, including judging management at `/admin/judging`

## Commands

```bash
npm run dev           # Local dev server (port 3000)
npm run dev:turbo     # Dev with Turbo bundler (faster)
npm run build         # Production build
npm run lint          # ESLint check
```

No test suite exists. Validate changes by running the dev server.

## Architecture

### Role-Based Access Control

The central access logic lives in two files:
- `src/lib/supabase/middleware.ts` — enforces route protection and redirects at the Next.js edge
- `src/lib/auth/routing.ts` — pure functions for resolving post-auth destinations (`resolvePostAuthPath`, `staffHome`)

**Staff roles** (`organizer_profiles.role`): `admin`, `organizer`, `judging_team`

**Portal access** is determined by `org_teams.portal_key` — organizers gain access to a portal tab when their team has a matching `portal_key`. Admins bypass all team checks.

**Invite redemption flow**: When a staff invite is accepted, the invite code is stored in `auth.users.raw_user_meta_data` as `staff_invite_code`. The middleware calls `redeem_organizer_invite` or `redeem_pending_organizer_invite` to create the `organizer_profiles` row. For judges, the code is stored as `judge_invite_code`.

### Database

Supabase (PostgreSQL) with Row Level Security. Migrations are in `supabase/migrations/` organized into subdirectories:
- `judging_portal_7-31/` — judging tables, RLS, scoring RPCs, visit/plan algorithm (scripts 010–015)
- `organizer_portal/` — staff roster, org_teams, tasks (scripts 020+)

Key Supabase RPCs used in code: `redeem_organizer_invite`, `redeem_pending_organizer_invite`, `redeem_judge_invite`, `suggest_judge_assignments`, `build_judging_plan`.

### Supabase Client Usage

| Context | Import from |
|---------|------------|
| Server components / route handlers | `src/lib/supabase/server.ts` → `createClient()` |
| Route handlers needing cookie write | `src/lib/supabase/server.ts` → `createClientForRouteHandler()` |
| Client components | `src/lib/supabase/client.ts` → `createClient()` |

Never use `@supabase/supabase-js` directly — always go through these wrappers.

### Email

All transactional email goes through Resend (`RESEND_API_KEY`). Email templates (HTML) are in `supabase/email-templates/`. API routes that send email live under `src/app/api/`.

### Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`). Always use `@/` imports.

### Key Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
EMAIL_FROM
EMAIL_FROM_NAME
```

## Deployment

- `dev` branch → auto-deploys to `rockethacks-dev.vercel.app`
- `main` branch → auto-deploys to `www.rockethacks.org`

Both environments share the same Supabase project; RLS policies provide data isolation.

## Conventions

- ESLint is relaxed (`@typescript-eslint/no-explicit-any` and `no-unused-vars` are off). Don't introduce new `any` types when avoidable.
- `next.config.js` disables TypeScript and ESLint errors during production builds — type errors won't block deploy but will cause runtime issues.
- Dynamic imports (`next/dynamic`) are used heavily in marketing page components for bundle splitting.
- Tailwind custom colors and animations are defined in `tailwind.config.ts`. Brand colors follow the RocketHacks space theme.
