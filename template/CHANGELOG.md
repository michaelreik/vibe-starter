# Changelog

All notable changes to this template (NOT to projects created from it).

## Unreleased

### Added
- Initial Next.js 16 + Supabase + Vercel scaffold.
- Magic-link auth + session-refresh middleware.
- `profiles` and `notes` migrations with full RLS.
- shadcn/ui components, light/dark mode.
- Vitest + Playwright test setup.
- GitHub Actions CI.
- `docs/VERSIONS.md`, `scripts/bump-versions.sh`.
- `PROGRESS.md`, `DECISIONS.md` scaffolds for agent-managed project memory.
- `.claude/skills/setup-project` — hybrid-onboarding skill.
- `/setup` slash command — triggers the setup-project skill.
- Replaced upstream `CLAUDE.md` and `AGENTS.md` with vibe-starter content.
- Feature-loop skills: `add-feature`, `add-supabase-table`, `add-rls-policy`, `update-progress`, `deploy-to-production`, `debug-supabase`.
- Slash commands: `/new-feature`, `/new-table`, `/ship`, `/status`.
