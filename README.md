# vibe-starter

A vibe-coding starter kit: a Next.js + Supabase + Vercel template plus a set
of Claude Code skills that take you from idea to a live, deployed web app in
under 15 minutes — auth, database, hosting, all wired up.

## Quick start

```bash
npx @michaelreik/create-vibe-app my-app
cd my-app
# Open the project in Claude Code, then type:
/setup
```

`/setup` walks you through three browser logins (GitHub, Supabase, Vercel),
creates the remote projects, sets env vars, deploys, and verifies that
magic-link sign-in works on the live URL. Then describe what you want to
build — the agent handles migrations, RLS, server actions, UI, tests, and
deploys.

## What you get

- **Next.js 16** App Router · React 19 · Tailwind v4 · shadcn/ui · light/dark mode
- **Supabase** magic-link auth · RLS-correct example tables (`profiles`, `notes`) · session-refresh middleware
- **Vercel** deploy config with security headers · EU region default
- **Tests + CI** Vitest unit · Playwright e2e · GitHub Actions on every PR
- **10 agent skills** for first-time setup, feature loops, shipping, and on-demand additions like custom domains, transactional email, and i18n

Slash commands shipped with the template:

| | |
|---|---|
| `/setup` | First-time onboarding (GitHub + Supabase + Vercel) |
| `/new-feature` | Migration → RLS → server actions → UI → tests, end to end |
| `/new-table` | New table with the canonical 4-policy RLS pattern |
| `/ship` | Verify locally → push → wait for Vercel → smoke-check live URL |
| `/status` | Snapshot of build state, open work, and project memory |
| `/add-email` | Wire Resend for transactional email |
| `/add-domain` | Custom domain on Vercel |
| `/add-i18n` | Multi-language support via next-intl |

## For contributors and maintainers

This repository is a monorepo with three pieces:

- `template/` — the Next.js + Supabase + Vercel scaffold (what users get)
- `cli/` — the `@michaelreik/create-vibe-app` npm package
- `MAINTAINER/` — internal docs, design spec, and implementation plans

See [`MAINTAINER/README.md`](MAINTAINER/README.md) for the test guide and
release checklist.

## License

[MIT](LICENSE).
