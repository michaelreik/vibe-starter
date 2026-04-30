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

## Doing feature work

For new features:
- Use the `add-feature` skill (Plan 3) when available; until then, follow this checklist:
  1. Read `PROGRESS.md` for context.
  2. Plan migrations, server actions, UI changes.
  3. **Always** add RLS policies for new user-owned tables. Use `supabase/migrations/0002_notes.sql` as the reference pattern.
  4. Update `PROGRESS.md` after each shipped feature.
  5. Append to `DECISIONS.md` if you make an architecture-relevant choice.

## Database changes

- Every migration goes in `supabase/migrations/000N_<name>.sql`.
- Every user-owned table MUST have RLS enabled and policies covering SELECT/INSERT/UPDATE/DELETE.
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
