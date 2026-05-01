# create-vibe-app

CLI wrapper for the [vibe-starter](https://github.com/vibe-starter/vibe-starter)
template. Scaffolds a Next.js 16 + Supabase + Vercel project pre-wired for
vibe coders, then hands off to a coding agent for the rest.

## Usage

```bash
npx create-vibe-app my-recipes
cd my-recipes
# Open in Claude Code (or any agent that reads .claude/), then type:
/setup
```

The agent walks you through three OAuth logins (GitHub, Supabase, Vercel),
creates the remote projects, deploys, and verifies. ~10 minutes from
scaffold to live URL.

## Options

```
create-vibe-app <project-directory> [options]

  --template <source>   degit source for the template repo
                        (default: vibe-starter/vibe-starter/template)
  --local <path>        Use a local copy of the template (for development)
  -h, --help            Show help
```

## What's in the template

- Next.js 16 (App Router, React 19, Tailwind v4)
- Supabase auth (magic link) + RLS-correct example tables
- shadcn/ui with light/dark mode
- Vitest + Playwright test setup
- GitHub Actions CI
- Vercel config with security headers
- 10 agent skills under `.claude/skills/` (`/setup`, `/new-feature`, `/new-table`, `/ship`, `/status`, `/add-email`, `/add-i18n`, `/add-domain`)

See the template repo for the full list.

## License

MIT.
