# CLAUDE.md

Project-level guidance for coding agents working in this repository.
This file is auto-discovered by Claude Code; treat it as the canonical
"how to work here" reference.

## Read these first, every session

1. **`PROGRESS.md`** — what we're building, what's been done, what's queued.
2. **`DECISIONS.md`** — architectural decisions with the *why*. Don't reverse one without adding a superseding entry.
3. **`AGENTS.md`** — Next.js 16-specific gotchas (this version differs from older training data).

## First-time onboarding

If `.vibe-state.json` does not exist, the project has not been set up yet.
Recommend the user run `/setup` before any other work. The setup flow
authenticates the user with GitHub, Supabase, and Vercel, then creates and
links the corresponding remote projects.

## Available skills and slash commands

The project ships with these agent skills under `.claude/skills/`:

| Skill | Trigger | What it does |
| --- | --- | --- |
| `setup-project` | `/setup` | First-time onboarding (GitHub + Supabase + Vercel) |
| `add-feature` | `/new-feature <desc>` | End-to-end feature: migration → RLS → actions → UI → tests → progress |
| `add-supabase-table` | `/new-table <desc>` | New table with canonical 4-policy RLS pattern |
| `add-rls-policy` | "is X secure?" | Audit and add RLS policies on existing tables |
| `update-progress` | (auto, after features) | Maintain `PROGRESS.md` |
| `deploy-to-production` | `/ship` | Verify + push + wait for Vercel + smoke-check |
| `debug-supabase` | "auth not working", etc. | Decision tree for common Supabase bugs |
| `add-email` | `/add-email` | Wire Resend for transactional emails |
| `add-i18n` | `/add-i18n` | Multi-language support via next-intl |
| `add-custom-domain` | `/add-domain` | Custom domain on Vercel (SSL via LetsEncrypt) |

## Database changes

- Every migration goes in `supabase/migrations/000N_<name>.sql`.
- Every user-owned table MUST have RLS enabled and policies covering SELECT/INSERT/UPDATE/DELETE — use `add-supabase-table` to get this right by default.
- Test migrations locally with `npx supabase db reset` before committing.

## Code style

- Follow existing patterns. Server Actions return `{ error: string } | void`. Client wrappers use `useTransition` + `toast` for feedback.
- shadcn/ui Button does NOT support `asChild` in this version — use `buttonVariants()` on a `<Link>` for navigation buttons.
- Pages in `app/(app)/` are auth-protected via root middleware; you don't need to re-check auth in each page.

## Deployment

- `npm run build` must pass before any push.
- Production deploys are triggered by pushing to `main`. Vercel handles SSL via LetsEncrypt automatically.

## State files (do not delete)

- `.vibe-state.json` — gitignored; tracks setup progress for idempotency.
- `PROGRESS.md` — committed; project memory.
- `DECISIONS.md` — committed; architecture log.
