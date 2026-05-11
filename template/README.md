# vibe-starter (template)

Production-ready scaffold for vibe-coded apps. Next.js 16 + Supabase + Vercel,
with auth, RLS, light/dark UI, CI, and one-command onboarding.

## Quick start (recommended — using a coding agent)

1. Scaffold a new project: `npx @michaelreik/create-vibe-app my-app`
2. Open the project in Claude Code (or any agent that reads `.claude/`).
3. Type `/setup` in the agent.
4. Click "Authorize" in three browser tabs (GitHub, Supabase, Vercel).
5. Tell the agent what you want to build.

That's it. The agent installs missing CLIs, creates the GitHub repo, the
Supabase project, the Vercel deployment, sets all env vars, runs migrations,
and verifies that magic-link login works on the live URL.

## Manual setup (without an agent)

```bash
git clone <your-repo> my-app && cd my-app
npm install

# 1. Local Supabase (requires Docker)
npx supabase start
npx supabase db reset

# 2. Configure env
cp .env.example .env.local
# Paste the values from `npx supabase status` into .env.local.

# 3. Run dev server
npm run dev
```

## What's inside

- **Auth**: Magic-link sign-in, session-refresh middleware, protected `/dashboard`, `/account`, `/notes`.
- **Database**: `profiles` and `notes` tables with full RLS.
- **UI**: shadcn/ui, Tailwind v4, light/dark mode toggle.
- **Tests**: Vitest unit tests, Playwright e2e smoke tests.
- **CI**: typecheck, lint, unit tests, build on every PR.
- **Deploy**: `vercel.json` with security headers, EU region default.
- **Agent skills**: onboarding (`/setup`), features (`/new-feature`, `/new-table`), shipping (`/ship`), status (`/status`), and a Supabase debug tree for common issues.

## Files agents care about

- `CLAUDE.md` — entry point for any coding agent.
- `AGENTS.md` — Next.js 16 + Supabase gotchas (newer than most training data).
- `PROGRESS.md` — your project memory; the agent reads it every session.
- `DECISIONS.md` — architectural decisions log.
- `.vibe-state.json` — gitignored; tracks `/setup` progress.

## Versions and updates

See `docs/VERSIONS.md` for the dependency versions this template was last
tested with, and `scripts/bump-versions.sh` to update everything.
