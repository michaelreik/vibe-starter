# vibe-starter

A "Vibe-Coding Starter Kit": template repository + CLI wrapper that lets a
less technical person go from idea to live deployed web app in <15 minutes
using a coding agent (Claude Code, Cursor) — complete with GitHub repo,
Supabase database including auth, and Vercel hosting.

## Quick start

```bash
npx create-vibe-app my-recipes
cd my-recipes
# Open in Claude Code → /setup → click 3× Authorize → live URL
```

## Repository layout

```
vibe-starter/
├── template/                     ← the template repo content (Next.js + Supabase + Vercel scaffold + 10 .claude/ skills)
├── cli/                          ← the create-vibe-app npm package
└── docs/superpowers/
    ├── specs/                    ← design spec
    └── plans/                    ← implementation plans (1–5)
```

When publishing:
- `template/` → public GitHub repo (`<user>/vibe-starter` recommended)
- `cli/` → npm package `create-vibe-app`

## Status

All five phase plans (Foundation → Setup Skill → Feature-Loop Skills → On-Demand
Skills → CLI Wrapper) are implemented and committed across feature branches.
See `docs/superpowers/plans/` for the per-phase plan documents.

## Next steps and how to test

See [`docs/MAINTAINER.md`](docs/MAINTAINER.md) for:
- The three remaining steps (mark repo as template, publish CLI to npm, end-to-end verify)
- A six-level testing guideline from "template builds locally" up to "feature-loop end-to-end"
