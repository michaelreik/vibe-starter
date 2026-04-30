# vibe-starter (template)

Production-ready scaffold for vibe-coded apps. Next.js 16 + Supabase + Vercel,
with auth, RLS, light/dark UI, and CI all pre-wired.

## Quick start (manual setup — until /setup is built in Plan 2)

```bash
# 1. Clone or "Use this template" on GitHub
git clone <your-repo> my-app && cd my-app
npm install

# 2. Start a local Supabase (requires Docker)
npx supabase start
# Note the API URL and anon/publishable key it prints.

# 3. Apply migrations
npx supabase db reset

# 4. Configure env
cp .env.example .env.local
# Paste the values from `supabase status` into .env.local.

# 5. Run dev server
npm run dev
# Open http://localhost:3000 — you'll be redirected to /login.
```

## What's inside

- **Auth**: Magic-link sign-in, session-refresh middleware, protected
  `/dashboard`, `/account`, `/notes`.
- **Database**: `profiles` (1:1 with auth.users) and `notes` (example
  user-owned content), both with full RLS policies.
- **UI**: shadcn/ui, Tailwind v4, light/dark mode toggle.
- **Tests**: Vitest unit tests, Playwright e2e smoke tests.
- **CI**: typecheck, lint, unit tests, build on every PR.
- **Deploy**: `vercel.json` with security headers, EU region default.

## Folder layout

See `docs/VERSIONS.md` for the dependency versions this template was last
tested with, and `scripts/bump-versions.sh` to update everything.
