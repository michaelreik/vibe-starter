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

The setup flow has seven stages. Each completed stage is recorded in `.vibe-state.json`
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
  "vercel_git_connected": true,
  "vercel_url": "<https://...>",
  "admin_email": "<email used at sign-in>",
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

If `.vibe-state.json.vercel_git_connected` is unset, **connect the Vercel
project to the GitHub repo** so `git push` triggers builds (otherwise only
manual `vercel --prod` deploys work — `/ship` and PR previews silently
do nothing). Run:

```bash
vercel git connect "https://github.com/<owner>/<repo>.git"
```

If the Vercel GitHub App isn't installed on the user's GitHub account yet,
this command will fail with a clear "GitHub App not installed" error and
print an install URL. In that case: open the URL in their browser, wait for
them to confirm install, then retry. Once it succeeds, record
`"vercel_git_connected": true` in state.

#### Sub-step 5d: Admin user

The app uses password auth. We seed a single admin user via the Supabase
Admin API so the user can sign in immediately after deploy. Only set this up
if `.vibe-state.json.admin_email` is unset.

1. Ask the user for an **admin email**. Default to `gh api user --jq .email`
   if it returns something usable; otherwise prompt them.
2. **Generate a strong password** — do NOT make the user invent one:
   ```bash
   openssl rand -base64 18 | tr -d '+/=' | head -c 18
   ```
3. **Show both clearly** and pause: tell the user the password is shown
   only once, ask them to save it in their password manager, and wait for a
   "saved" confirmation before continuing.
4. Create the user via the Supabase Admin API. Use the service-role key
   from earlier (do NOT use the anon key — admin endpoints reject it):
   ```bash
   curl -sf -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
     -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
     -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"<email>\",\"password\":\"<password>\",\"email_confirm\":true}"
   ```
   `email_confirm: true` marks the address as already verified so the user can
   sign in without clicking a confirmation link.
5. Record `admin_email` in state (NEVER the password).

Append `"remote_projects"`.

### Stage 6: first_deploy

`vercel --prod`. This kicks off the first production deploy. Wait for it (typical
2-3 minutes; show progress to the user). Capture the production URL from the
output. Save it as `vercel_url` in state.

Update the `NEXT_PUBLIC_SITE_URL` Vercel env var to the real URL (used by
any future email features and shared everywhere `siteUrl` is referenced):
- `vercel env rm NEXT_PUBLIC_SITE_URL production --yes`
- `echo "<real url>" | vercel env add NEXT_PUBLIC_SITE_URL production`
- Re-deploy: `vercel --prod` (so the new env var takes effect).

Append `"first_deploy"`.

### Stage 7: verified

Open the production URL in the user's browser (`open <url>` on macOS,
`xdg-open <url>` on Linux). Tell the user: "I've opened the deployed app.
Sign in with `<admin_email>` and the password you saved earlier. Come back
and tell me 'logged in' once you see the dashboard."

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
