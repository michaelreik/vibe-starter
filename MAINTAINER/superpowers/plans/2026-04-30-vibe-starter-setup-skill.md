# vibe-starter Setup-Skill Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `setup-project` skill, the `/setup` slash command, and a slim `CLAUDE.md` that turns the static template from Plan 1 into a guided one-command onboarding experience for vibe coders. After Plan 2, a vibe coder clones the repo, opens Claude Code, types `/setup`, clicks through three OAuth logins in the browser, and ends with a live deployed app on Vercel — backed by a real GitHub repo and Supabase project.

**Architecture:** Skills are markdown files under `template/.claude/skills/<skill-name>/SKILL.md`. Slash commands are markdown files under `template/.claude/commands/<command>.md`. Both are auto-discovered by Claude Code when working inside the template. State for the setup flow lives in `template/.vibe-state.json` (gitignored, machine-managed). The skill itself is just *instructions to the agent* — there is no executable code we ship; the agent reads the skill and runs the right CLI commands itself.

**Tech Stack:** Markdown skills/commands. Shell commands invoked by the agent: `gh` (GitHub CLI), `supabase` (Supabase CLI, already a devDep), `vercel` (Vercel CLI). Detection helpers in `bash` (Homebrew/npm).

**Working directory for all tasks:** `/Users/michaelreikersdorfer/Development/vibe-starter/template/`. Parent repo on branch `feat/setup-skill`.

---

## File Structure (new in Plan 2)

```
template/
├── .claude/
│   ├── skills/
│   │   └── setup-project/
│   │       └── SKILL.md             # the hybrid-onboarding instructions
│   └── commands/
│       └── setup.md                 # slash command → invokes setup-project skill
├── CLAUDE.md                        # REPLACED (was upstream stub)
├── AGENTS.md                        # REPLACED (was upstream stub)
├── .vibe-state.json                 # gitignored — created by /setup at runtime
├── README.md                        # updated: /setup as the primary path
├── CHANGELOG.md                     # updated
└── DECISIONS.md                     # updated with new ADRs
```

---

## Task 1: Replace upstream CLAUDE.md with slim Plan-2 version

**Files:**
- Modify: `template/CLAUDE.md` (was: `@AGENTS.md` 1-liner from create-next-app)

- [ ] **Step 1: Write the new CLAUDE.md**

Replace the entire content of `template/CLAUDE.md` with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter
git add template/CLAUDE.md
git -c commit.gpgsign=false commit -m "docs(claude): slim CLAUDE.md pointing to skills, state files, and conventions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Replace upstream AGENTS.md with our content

**Files:**
- Modify: `template/AGENTS.md` (was: 5-line warning from create-next-app)

- [ ] **Step 1: Write the new AGENTS.md**

Replace the entire content of `template/AGENTS.md` with:

```markdown
# AGENTS.md — Next.js 16 + Supabase notes

This template runs on **Next.js 16** (App Router, React 19, Turbopack)
and **`@supabase/ssr`** — both newer than most LLM training data.
A few non-obvious patterns to honor:

## Next.js 16

- `cookies()` from `next/headers` is **async**: `const cookieStore = await cookies();`
- Route handler `params` is a **Promise**: `type Params = Promise<{ id: string }>;` then `const { id } = await params;`
- Server Actions used directly in `<form action={...}>` must return `void` or `Promise<void>`. To return error objects, wrap them in a client component using `useTransition` (see `components/notes/note-form.tsx`).
- Read live framework docs at `node_modules/next/dist/docs/` if anything feels unfamiliar.

## @supabase/ssr (NOT @supabase/auth-helpers-nextjs)

- Browser client: `import { createClient } from "@/lib/supabase/client";`
- Server client (Server Components, Actions, Routes): `import { createClient } from "@/lib/supabase/server"; const supabase = await createClient();` — note the `await`.
- Middleware session refresh lives in `lib/supabase/middleware.ts`; it also enforces the auth gate for `/dashboard`, `/account`, `/notes`.

## RLS is mandatory

Every user-owned table MUST have:
- `alter table public.<name> enable row level security;`
- Policies covering each command the app uses (see `supabase/migrations/0002_notes.sql` for the canonical four-policy pattern).

Without RLS, anon-key requests return all rows from anyone — a guaranteed data leak in production.

## shadcn/ui (4.x)

- Built on `@base-ui/react`, NOT Radix. The `asChild` prop is not supported on `Button`.
- For "button that navigates", use `<Link href="..." className={buttonVariants()}>...</Link>`.
```

- [ ] **Step 2: Commit**

```bash
git add template/AGENTS.md
git -c commit.gpgsign=false commit -m "docs(agents): replace upstream stub with Next 16 + Supabase agent guidance

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create .claude directory structure

**Files:**
- Create: `template/.claude/skills/setup-project/` (empty directory)
- Create: `template/.claude/commands/` (empty directory)

- [ ] **Step 1: Make directories**

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter/template
mkdir -p .claude/skills/setup-project .claude/commands
```

- [ ] **Step 2: Add a `.gitkeep` so the directories exist on clone (we'll populate them in Tasks 4 and 5; no commit yet — combined with Task 4)**

(No commit on this task alone; the next two tasks fill these directories and commit together.)

---

## Task 4: Write the setup-project skill

**Files:**
- Create: `template/.claude/skills/setup-project/SKILL.md`

This is the largest file in Plan 2 and the heart of the deliverable. The skill is read by the coding agent when triggered (via `/setup`); it tells the agent exactly how to walk the user through the hybrid onboarding flow.

- [ ] **Step 1: Write SKILL.md**

Create `template/.claude/skills/setup-project/SKILL.md` with this exact content:

````markdown
---
name: setup-project
description: First-time onboarding flow for a freshly cloned vibe-starter project. Installs missing CLIs, walks the user through GitHub/Supabase/Vercel OAuth logins, creates the remote projects, configures env vars, and triggers the first deploy. Idempotent via .vibe-state.json — safe to re-run.
---

# setup-project Skill

You are guiding a user through the **first-time setup** of a vibe-starter
project. The user is a "vibe coder" — they trust your judgment and click
through OAuth screens, but do not want to type CLI commands themselves.
You run all CLI commands. They click "Authorize" three times. That's it.

## When to invoke

- On `/setup` slash command.
- When the user opens a fresh clone and asks "how do I start" / "let's set up" / "deploy this".
- When `.vibe-state.json` is missing AND the user wants to do feature work — recommend `/setup` first.

## Resumability — read first

The setup flow has six stages. Each completed stage is recorded in `.vibe-state.json`
at the project root. **At the very start of every invocation, read `.vibe-state.json`
if it exists** to determine which stages are already done. Skip those stages and
resume from the first incomplete one.

`.vibe-state.json` schema:

```json
{
  "version": 1,
  "completed_stages": ["tools_check", "github_login", "supabase_login", "vercel_login", "remote_projects", "first_deploy", "verified"],
  "github_repo": "<owner>/<name>",
  "supabase_project_ref": "<ref>",
  "supabase_region": "<region>",
  "vercel_project_id": "<id>",
  "vercel_url": "<https://...>",
  "started_at": "<ISO datetime>",
  "completed_at": "<ISO datetime, only when all stages done>"
}
```

Always update `.vibe-state.json` after each stage completes. Never delete keys —
add new ones over time.

## Stages

### Stage 1: tools_check

Verify these CLIs are installed: `git`, `gh`, `supabase` (already in devDeps,
runnable as `npx supabase`), `vercel`.

For each missing CLI, install it:
- macOS: prefer `brew install <name>` if Homebrew is available.
- Linux: `gh` via apt/dnf; `vercel` via `npm install -g vercel`.
- Fall back to npm-installable equivalents where possible.
- If you cannot install (no `brew`, no admin rights, etc.), STOP and tell the user
  exactly what to install manually with copy-pasteable commands.

After all four are present, append `"tools_check"` to `completed_stages`.

### Stage 2: github_login

Tell the user "I'll open your browser for GitHub. Click Authorize."

Run `gh auth status` to check if already logged in. If yes, skip to recording the stage.

Otherwise run `gh auth login --web --git-protocol https`. The CLI is interactive —
read its prompts and answer with reasonable defaults (account: github.com, protocol:
HTTPS, authenticate with a web browser). Tell the user when to switch to the
browser. After it succeeds, run `gh auth status` to confirm.

Record the GitHub username in `.vibe-state.json` (read from `gh api user --jq .login`).
Append `"github_login"`.

### Stage 3: supabase_login

Same pattern: tell the user "browser will open for Supabase, click Authorize".

Check existing login: `npx supabase projects list` — if it works, already logged in.
Otherwise: `npx supabase login` (web flow).

Append `"supabase_login"`.

### Stage 4: vercel_login

Same pattern. `vercel whoami` to check; `vercel login` to authenticate. Append.

### Stage 5: remote_projects

This stage creates the GitHub repo, the Supabase project, links Vercel, pushes
migrations, and sets env vars. Each sub-step is also resumable — record sub-keys
in `.vibe-state.json` (`github_repo`, `supabase_project_ref`, `vercel_project_id`)
and skip sub-steps where the key is already populated.

#### Ask the user three questions before proceeding:
1. **Project name** — default: the current folder name (`basename "$PWD"`).
2. **Supabase region** — default: `eu-central-1` (Frankfurt). Other common: `us-east-1`, `us-west-1`, `ap-southeast-1`. Important: cannot be changed later without migration.
3. **Vercel region** — default: `fra1` (matches `vercel.json`). If user picks something else, also update `vercel.json`.

#### Sub-step 5a: GitHub repo

If `.vibe-state.json.github_repo` is unset:
- Run `gh repo create <name> --private --source=. --push --remote=origin`.
- If a repo with that name already exists for this user, ask: "Repo `<owner>/<name>` already exists. Use it (and force-push), pick a new name, or abort?" Default: pick a new name.
- After success, record `<owner>/<name>` in state.

#### Sub-step 5b: Supabase project

If `.vibe-state.json.supabase_project_ref` is unset:
- Generate a random database password (24+ chars, alphanumeric + symbols).
  Example: `openssl rand -base64 24 | tr -d '+/=' | head -c 24`. Tell the user
  the password is being saved to the password manager (1Password, etc.) — actually,
  for a starter, write it to `.env.local` under `SUPABASE_DB_PASSWORD` (gitignored)
  AND tell the user to copy it somewhere safe. Mention they can also retrieve it
  from `app.supabase.com → Project Settings → Database`.
- Run `npx supabase projects create <name> --org-id <get from prompt or supabase orgs list> --region <region> --db-password <generated>`.
- Get the project ref from output (`supabase projects list` shows it).
- `npx supabase link --project-ref <ref>` to link the local CLI.
- `npx supabase db push --include-all` to apply migrations to the remote.
- Pull the API URL and anon key: `npx supabase projects api-keys --project-ref <ref>`.
- Record `supabase_project_ref` in state.

If the user has hit the Free Tier limit (max 2 projects), STOP with a clear error:
"Supabase Free Tier allows 2 projects. Delete one at app.supabase.com or upgrade
to Pro." Do not try to work around this.

#### Sub-step 5c: Vercel project

If `.vibe-state.json.vercel_project_id` is unset:
- `vercel link --yes` (auto-pairs to a new Vercel project named after the folder).
- Add env vars: for each of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`:
  - `echo "<value>" | vercel env add <name> production`
  - `echo "<value>" | vercel env add <name> preview`
  - `echo "<value>" | vercel env add <name> development`
- For `NEXT_PUBLIC_SITE_URL` use a placeholder (`https://placeholder.vercel.app`); update it after the first deploy reveals the actual URL.
- Read `.vercel/project.json` for `projectId`, record in state.

If Vercel Free Tier limit (3 hobby projects), STOP with the same kind of message.

Append `"remote_projects"`.

### Stage 6: first_deploy

`vercel --prod`. This kicks off the first production deploy. Wait for it (typical
2-3 minutes; show progress to the user). Capture the production URL from the
output. Save it as `vercel_url` in state.

Update the `NEXT_PUBLIC_SITE_URL` Vercel env var to the real URL (so magic-link
emails redirect correctly):
- `vercel env rm NEXT_PUBLIC_SITE_URL production --yes`
- `echo "<real url>" | vercel env add NEXT_PUBLIC_SITE_URL production`
- Re-deploy: `vercel --prod` (so the new env var takes effect).

Append `"first_deploy"`.

### Stage 7: verified

Open the production URL in the user's browser (`open <url>` on macOS,
`xdg-open <url>` on Linux). Tell the user: "I've opened the deployed app.
Sign in with the email you'd like to use — you'll get a magic link. Click it,
then come back here and tell me 'logged in' once you see the dashboard."

Wait for the user. When they confirm, append `"verified"` and set `completed_at`
in state. Print a final summary:

```
Setup complete.
  Repo:   https://github.com/<owner>/<name>
  DB:     https://app.supabase.com/project/<ref>
  Live:   <vercel_url>

Next steps: tell me what you want to build, or open PROGRESS.md to plan.
```

## Edge cases

- **User Ctrl-C's mid-stage**: state file holds last completed stage. Re-running `/setup` resumes there. Sub-steps within Stage 5 are also resumable.
- **OAuth flow opens but user doesn't click**: the CLI command will hang or fail. If it fails, retry once, then tell the user to manually run the auth command and report back.
- **Region change**: if the user re-runs `/setup` and wants a different Supabase region, that means deleting the existing project. Don't auto-delete — ask the user to do it via the Supabase dashboard, then clear `supabase_project_ref` from state and re-run.
- **`.vibe-state.json` is corrupt**: if JSON parse fails, ask the user before deleting. Suggest backing it up first.

## Reporting back

After Stage 7, summarize what was done. Don't be verbose — three lines (repo, DB, live URL) is enough. Then ask the user what they want to build.

If you stopped mid-flow due to an error, report exactly which stage failed, what the error was, and what the user should do (free up Tier limits, click Authorize, etc.). Don't try clever workarounds.

## What you do NOT do

- Spend the user's money without consent (paid Supabase tier, paid Vercel tier, paid domain).
- Skip RLS or migrations to "make it faster".
- Push secrets to git.
- Modify `vercel.json` regions silently — ask first.
- Continue past a Free Tier limit error — surface it.
````

- [ ] **Step 2: Verify YAML frontmatter is well-formed**

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter/template
head -5 .claude/skills/setup-project/SKILL.md
```

Expected: starts with `---`, contains `name:` and `description:`, ends frontmatter with `---`.

- [ ] **Step 3: Commit (combined with Task 5 below — see Task 5 Step 3)**

(No commit yet; combined with the slash command in Task 5.)

---

## Task 5: Write the /setup slash command

**Files:**
- Create: `template/.claude/commands/setup.md`

- [ ] **Step 1: Write setup.md**

Slash commands in Claude Code are markdown files where the body is the prompt
that gets injected when the user types the command. Create
`template/.claude/commands/setup.md`:

```markdown
---
description: First-time onboarding — installs CLIs, walks through GitHub/Supabase/Vercel OAuth, creates remote projects, deploys to Vercel.
---

Run the `setup-project` skill to onboard this fresh project. The user has just
cloned the repo and wants you to set up everything: GitHub repo, Supabase
database, Vercel deployment. Walk them through the hybrid OAuth flow and
record progress in `.vibe-state.json` for idempotency.

Read `.claude/skills/setup-project/SKILL.md` and follow it exactly.
```

- [ ] **Step 2: Commit Tasks 3, 4, 5 together**

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter
git add template/.claude/
git -c commit.gpgsign=false commit -m "feat(claude): setup-project skill + /setup slash command

Adds .claude/skills/setup-project/SKILL.md (the hybrid-onboarding
instructions: tools check, three OAuth logins, GitHub repo creation,
Supabase project + migrations, Vercel link + env + deploy, verification)
and .claude/commands/setup.md (the slash command that triggers it).

State for idempotency lives in .vibe-state.json (gitignored, written by
the skill at runtime).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Update README to mention /setup as the primary path

**Files:**
- Modify: `template/README.md`

- [ ] **Step 1: Replace README.md content**

Replace the entire content of `template/README.md` with:

````markdown
# vibe-starter (template)

Production-ready scaffold for vibe-coded apps. Next.js 16 + Supabase + Vercel,
with auth, RLS, light/dark UI, CI, and one-command onboarding.

## Quick start (recommended — using a coding agent)

1. Click **Use this template** on GitHub (or `git clone` it).
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
- **Agent skills**: `.claude/skills/setup-project/` for onboarding (more skills land in Plan 3).

## Files agents care about

- `CLAUDE.md` — entry point for any coding agent.
- `AGENTS.md` — Next.js 16 + Supabase gotchas (newer than most training data).
- `PROGRESS.md` — your project memory; the agent reads it every session.
- `DECISIONS.md` — architectural decisions log.
- `.vibe-state.json` — gitignored; tracks `/setup` progress.

## Versions and updates

See `docs/VERSIONS.md` for the dependency versions this template was last
tested with, and `scripts/bump-versions.sh` to update everything.
````

- [ ] **Step 2: Commit**

```bash
git add template/README.md
git -c commit.gpgsign=false commit -m "docs: README leads with /setup as the primary onboarding path

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Update CHANGELOG and DECISIONS

**Files:**
- Modify: `template/CHANGELOG.md`
- Modify: `template/DECISIONS.md`

- [ ] **Step 1: Update CHANGELOG.md**

Replace the `## Unreleased` section in `template/CHANGELOG.md` with:

```markdown
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
```

- [ ] **Step 2: Append a new ADR to DECISIONS.md**

Append to `template/DECISIONS.md` (after the last existing entry):

```markdown

## 2026-04-30 — Hybrid setup flow over fully-automated or fully-manual

**Status:** active

**Context:** Vibe coders need to bootstrap GitHub + Supabase + Vercel without typing CLI commands. Three options: (A) fully automated via API tokens (impossible without admin OAuth flows), (B) fully manual checklist in README (high friction, high failure rate), (C) hybrid — agent runs CLIs, user clicks Authorize.

**Decision:** Hybrid. The `setup-project` skill installs CLIs, runs them, and reads `gh`/`supabase`/`vercel` browser-OAuth flows. The user clicks Authorize three times.

**Why:** Fully automated requires service-account credentials we can't safely ship. Fully manual loses the "agent does everything" promise. Hybrid hits the lowest viable friction.

**Trade-off:** Skill cannot run unattended (e.g., in CI). That's acceptable — `/setup` is a one-time human-driven flow.

## 2026-04-30 — `.vibe-state.json` for setup idempotency

**Status:** active

**Context:** `/setup` has six stages, several minutes long. Mid-flow failures (network, OAuth timeouts, Free Tier limits) are common. Re-running from scratch is wasteful and confusing.

**Decision:** Each completed stage appends to `.vibe-state.json.completed_stages`. The skill reads it on every invocation and skips done stages. Sub-step keys (`github_repo`, `supabase_project_ref`, `vercel_project_id`) allow finer-grained resumption inside Stage 5.

**Why:** A single re-runnable `/setup` is dramatically simpler UX than asking the user to remember which step failed.

**Trade-off:** Stale state can confuse the skill (e.g., user deleted the GitHub repo manually but `github_repo` is still in state). Edge cases are spelled out in the skill's "Edge cases" section.
```

- [ ] **Step 3: Commit**

```bash
git add template/CHANGELOG.md template/DECISIONS.md
git -c commit.gpgsign=false commit -m "docs: CHANGELOG + DECISIONS for setup-project skill and state file

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Final verification

This plan ships markdown content; there's no build/test pipeline that verifies
the skill works end-to-end (the actual setup creates real GitHub/Supabase/Vercel
projects, costs the user real Free Tier slots, and would litter the user's
accounts). Verification is: (a) the markdown is well-formed, (b) the build still
passes, (c) the structure matches the spec.

- [ ] **Step 1: Build still passes**

```bash
cd /Users/michaelreikersdorfer/Development/vibe-starter/template
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Expected: all green. The skill files live under `.claude/` which is not in any
TypeScript include path, so the build is unaffected.

- [ ] **Step 2: Skill structure matches spec**

```bash
ls .claude/skills/setup-project/SKILL.md .claude/commands/setup.md
head -5 .claude/skills/setup-project/SKILL.md
head -5 .claude/commands/setup.md
```

Expected: both files exist, both start with YAML frontmatter (`---` ... `---`).

- [ ] **Step 3: Manual walkthrough checklist (do NOT execute — this is what a human reviewer should run before declaring Plan 2 done)**

Print this checklist to the user as the final report:

```
Manual verification checklist (run on a throwaway clone):

[ ] Fresh clone in a separate folder.
[ ] Open in Claude Code → it auto-loads CLAUDE.md.
[ ] Type /setup. Skill begins.
[ ] Stage 1: skill installs gh / supabase / vercel if missing.
[ ] Stage 2-4: three browser tabs open for OAuth. Click Authorize each.
[ ] Stage 5: skill prompts for project name, regions. Defaults sensible.
[ ] Stage 5: gh repo created (private, pushed). Supabase project created in chosen region. Vercel linked, env vars set.
[ ] Stage 6: vercel --prod runs to completion. URL captured.
[ ] Stage 6: NEXT_PUBLIC_SITE_URL updated to real URL, re-deploy triggered.
[ ] Stage 7: skill opens the live URL. Magic-link login works end-to-end.
[ ] .vibe-state.json contains all 7 stages and the resource IDs.

[ ] Bonus — resumability test: delete .vibe-state.json halfway through, re-run /setup, confirm it picks up.
```

- [ ] **Step 4: Commit any leftover changes**

```bash
git status
# If clean, you're done.
# If anything stray:
git add -A
git -c commit.gpgsign=false commit -m "chore: post-Plan-2 cleanup"
```

---

## What ships when this plan is complete

A vibe coder can:

1. Click "Use this template" on GitHub.
2. Open the new repo in Claude Code.
3. Type `/setup`.
4. Click Authorize three times.
5. Get a deployed app on Vercel in <10 minutes from cloning.

Plan 3 will add the feature-loop skills (`add-feature`, `add-supabase-table`,
`add-rls-policy`, `update-progress`, `deploy-to-production`, `debug-supabase`)
on top of this foundation.
