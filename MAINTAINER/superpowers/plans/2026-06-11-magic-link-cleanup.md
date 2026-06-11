# Magic-Link Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every stale magic-link reference left behind by commit `600d9b4` (which switched auth to email + password) — fix the broken e2e test, correct docs and agent skills, drop committed test artifacts, and patch-publish the npm CLI README.

**Architecture:** No behavior changes. The login page, auth actions, and `setup-project` skill already implement email + password with an admin user seeded during `/setup`. This plan only touches tests, comments, markdown docs, and skill instructions so they stop contradicting the code. One npm patch release (`0.1.2`) updates the package README shown on npmjs.com — the CLI pulls the template fresh from GitHub via degit, so no CLI code changes are needed.

**Tech Stack:** Playwright (e2e), markdown docs, npm publish.

**Spec:** `MAINTAINER/superpowers/specs/2026-06-11-magic-link-cleanup-design.md`

**Repo layout note:** This is the vibe-starter monorepo. `template/` is the scaffolded app, `cli/` is the published npm package `@michaelreik/create-vibe-app`. Work happens on `main` (the repo's convention — see git history).

---

### Task 1: Rewrite the broken e2e auth test

The second test in `auth.spec.ts` still fills only an email and clicks a "Send magic link" button that no longer exists (the login form is email + password since `600d9b4`). Rewrite it to prove the password form wires through to Supabase: bogus credentials must surface Supabase's "Invalid login credentials" error in a toast.

**Files:**
- Modify: `template/tests/e2e/auth.spec.ts`

- [ ] **Step 1: Replace the stale test**

Replace the entire contents of `template/tests/e2e/auth.spec.ts` with:

```typescript
import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to /login from /dashboard", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  // Don't use getByText("Sign in") — it matches both the card title and the
  // submit button, which violates Playwright strict mode.
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("login form rejects bad credentials with an error toast", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  // Supabase returns "Invalid login credentials"; the page shows it via toast.
  await expect(page.getByText(/invalid login credentials/i)).toBeVisible({
    timeout: 10_000,
  });
});
```

Why this assertion: `signInWithPassword` in `template/lib/actions/auth.ts` returns `{ error: error.message }` on failure, and `template/app/(auth)/login/page.tsx` renders it with `toast.error(result.error)`. Supabase's message for a wrong email/password is exactly "Invalid login credentials".

- [ ] **Step 2: Start the local Supabase stack (needed for the sign-in round-trip)**

```bash
cd template && npx supabase start
```

Expected: prints the local API URL `http://127.0.0.1:54321` (matches `template/.env.local`). If it's already running, it says so — fine either way.

- [ ] **Step 3: Run the e2e tests**

```bash
cd template && npx playwright test tests/e2e/auth.spec.ts
```

Playwright starts `npm run dev` itself (see `webServer` in `playwright.config.ts`).
Expected: `2 passed`. If the second test fails on the toast text, run headed (`--headed`) and check what the toast actually says — adjust the regex only if Supabase's message differs, never loosen it to `/error/`.

- [ ] **Step 4: Commit**

```bash
git add template/tests/e2e/auth.spec.ts
git commit -m "test(template): e2e test exercises password login, not the removed magic-link form"
```

---

### Task 2: Remove committed Playwright artifacts and gitignore them

`template/test-results/` and `template/playwright-report/` are committed test artifacts (some from the magic-link era). They are machine-generated noise — Playwright recreates them on every run.

**Files:**
- Delete (from git): `template/test-results/`, `template/playwright-report/`
- Modify: `template/.gitignore`

- [ ] **Step 1: Remove the artifacts from git and disk**

```bash
git rm -r -q template/test-results template/playwright-report
```

(If Task 1's test run just regenerated them on disk, `git rm` may complain about local modifications — use `git rm -r -q --cached` then `rm -rf` the directories instead. Either way they must leave the index.)

- [ ] **Step 2: Add them to the template's .gitignore**

In `template/.gitignore`, find:

```
# testing
/coverage
```

Replace with:

```
# testing
/coverage
/test-results/
/playwright-report/
```

- [ ] **Step 3: Verify nothing tracked remains**

```bash
git ls-files template/test-results template/playwright-report
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add template/.gitignore
git commit -m "chore(template): drop committed Playwright artifacts, gitignore them"
```

---

### Task 3: Fix the root README and CLI README

Both still advertise magic-link auth as the current feature set.

**Files:**
- Modify: `README.md` (root)
- Modify: `cli/README.md`

- [ ] **Step 1: Fix root README — setup description**

In `README.md`, find:

```
`/setup` walks you through three browser logins (GitHub, Supabase, Vercel),
creates the remote projects, sets env vars, deploys, and verifies that
magic-link sign-in works on the live URL. Then describe what you want to
```

Replace with:

```
`/setup` walks you through three browser logins (GitHub, Supabase, Vercel),
creates the remote projects, sets env vars, seeds your admin login
(email + a generated password shown once), deploys, and verifies that
password sign-in works on the live URL. Then describe what you want to
```

- [ ] **Step 2: Fix root README — feature list**

In `README.md`, find:

```
- **Supabase** magic-link auth · RLS-correct example tables (`profiles`, `notes`) · session-refresh middleware
```

Replace with:

```
- **Supabase** email + password auth (admin user seeded at `/setup`) · RLS-correct example tables (`profiles`, `notes`) · session-refresh middleware
```

- [ ] **Step 3: Fix CLI README — feature list**

In `cli/README.md`, find:

```
- Supabase auth (magic link) + RLS-correct example tables
```

Replace with:

```
- Supabase auth (email + password, admin user seeded at /setup) + RLS-correct example tables
```

- [ ] **Step 4: Verify no magic-link mentions remain in either README**

```bash
grep -ni magic README.md cli/README.md
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add README.md cli/README.md
git commit -m "docs: READMEs describe password auth, not magic link"
```

---

### Task 4: Fix stale comments in .env.example and next.config.ts

**Files:**
- Modify: `template/.env.example`
- Modify: `template/next.config.ts`

- [ ] **Step 1: Fix the .env.example comment**

In `template/.env.example`, find:

```
# Public URL of your deployed app — used in magic-link redirects.
```

Replace with:

```
# Public URL of your deployed app — used in auth-email redirects
# (password reset, invites) and anywhere siteUrl is referenced.
```

- [ ] **Step 2: Fix the next.config.ts comment**

In `template/next.config.ts`, find:

```typescript
  // Next.js 16 blocks dev-resource requests from any host other than localhost.
  // The Supabase magic-link cookie is scoped to 127.0.0.1, so we test sign-in
  // from there — allow it (dev only; no effect on production builds).
```

Replace with:

```typescript
  // Next.js 16 blocks dev-resource requests from any host other than localhost.
  // The local Supabase stack lives on 127.0.0.1, so sign-in is also tested
  // from there — allow it (dev only; no effect on production builds).
```

- [ ] **Step 3: Type-check still passes (comment-only change, but it's the gate)**

```bash
cd template && npx tsc --noEmit
```

Expected: exit 0, no output.

- [ ] **Step 4: Commit**

```bash
git add template/.env.example template/next.config.ts
git commit -m "docs(template): update env/config comments for password auth"
```

---

### Task 5: Reword the four agent skills

The underlying instructions (redirect URLs, SMTP, site_url) remain valid for auth emails generally (password reset, invites); only the magic-link wording changes so future agent runs don't try to verify a flow that doesn't exist.

**Files:**
- Modify: `template/.claude/skills/add-custom-domain/SKILL.md`
- Modify: `template/.claude/skills/add-email/SKILL.md`
- Modify: `template/.claude/skills/debug-supabase/SKILL.md`
- Modify: `template/.claude/skills/deploy-to-production/SKILL.md`

- [ ] **Step 1: add-custom-domain — four references**

In `template/.claude/skills/add-custom-domain/SKILL.md`:

Find:
```
Magic-link emails must redirect to the new domain:
```
Replace with:
```
Auth emails (password reset, invites) must redirect to the new domain:
```

Find:
```
Supabase will reject magic-link callbacks to URLs not in its allow-list.
```
Replace with:
```
Supabase will reject auth-email callbacks to URLs not in its allow-list.
```

Find:
```
Open the domain in a browser and have the user do a magic-link sign-in.
Confirm the email link goes to the new domain (not the old `*.vercel.app`).
```
Replace with:
```
Open the domain in a browser and have the user sign in with their email
and password. Confirm the app works on the new domain (not the old
`*.vercel.app`).
```

Find:
```
- Skip updating `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs — magic-link login breaks otherwise.
```
Replace with:
```
- Skip updating `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs — auth emails (password reset, invites) break otherwise.
```

- [ ] **Step 2: add-email — three references**

In `template/.claude/skills/add-email/SKILL.md`:

Find:
```
on free tier. For production magic-link auth at scale, swap to Resend SMTP.

Ask the user: "Do you want Supabase to send magic-link emails via Resend?
This raises the rate limit and improves deliverability. (yes/no)"
```
Replace with:
```
on free tier. For production auth emails at scale, swap to Resend SMTP.

Ask the user: "Do you want Supabase to send auth emails (password reset,
invites) via Resend? This raises the rate limit and improves
deliverability. (yes/no)"
```

Find:
```
3. Save. Test by triggering a magic link sign-in.
```
Replace with:
```
3. Save. Test by triggering a password-reset email from the login flow
   (or via Supabase dashboard → Authentication → Users → "Send password
   recovery").
```

- [ ] **Step 3: debug-supabase — rename branch C**

In `template/.claude/skills/debug-supabase/SKILL.md`:

Find:
```
### C. Magic link: "I never get the email"
```
Replace with:
```
### C. Auth emails (password reset, invites): "I never get the email"
```

The four numbered diagnostics under it (Mailpit, SMTP rate limit, spam folder, auth logs) stay as-is — they apply to any Supabase auth email.

- [ ] **Step 4: deploy-to-production — one reference**

In `template/.claude/skills/deploy-to-production/SKILL.md`:

Find:
```
- **First deploy after a custom-domain change**: the magic-link `NEXT_PUBLIC_SITE_URL` env var must match the new domain — invoke `add-custom-domain` skill (Plan 4) if you didn't already.
```
Replace with:
```
- **First deploy after a custom-domain change**: the `NEXT_PUBLIC_SITE_URL` env var (used in auth-email redirects) must match the new domain — invoke `add-custom-domain` skill (Plan 4) if you didn't already.
```

- [ ] **Step 5: Verify the skills are clean**

```bash
grep -rni magic template/.claude/skills/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add template/.claude/skills
git commit -m "docs(template/skills): reword magic-link references to auth emails / password sign-in"
```

---

### Task 6: Repo-wide verification

**Files:** none (verification only)

- [ ] **Step 1: Grep for remaining magic-link references**

```bash
grep -rni magic . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git -l
```

Expected output — history/generated files only:

```
./MAINTAINER/README.md
./MAINTAINER/superpowers/specs/2026-04-30-vibe-starter-design.md
./MAINTAINER/superpowers/specs/2026-06-11-magic-link-cleanup-design.md
./MAINTAINER/superpowers/plans/2026-04-30-vibe-starter-foundation.md
./MAINTAINER/superpowers/plans/2026-04-30-vibe-starter-setup-skill.md
./MAINTAINER/superpowers/plans/2026-06-11-magic-link-cleanup.md
./template/CHANGELOG.md
./template/DECISIONS.md
./template/package-lock.json
./template/supabase/config.toml
./.claude/settings.local.json
```

Anything else listed = a missed file; go fix it. (`MAINTAINER/README.md` describes repo history; `package-lock.json` matches dependency internals; `config.toml` line 207 is a Supabase-generated comment; `.claude/settings.local.json` is a gitignored local permissions file.)

- [ ] **Step 2: Template still builds**

```bash
cd template && npm run build
```

Expected: build succeeds (exit 0). This is the repo's pre-push gate per `template/CLAUDE.md`.

- [ ] **Step 3: Full e2e suite passes**

```bash
cd template && npx playwright test
```

Expected: `2 passed` (the auth spec is the only e2e file).

---

### Task 7: npm patch release of @michaelreik/create-vibe-app

Only the README changed; the CLI pulls the template from GitHub at scaffold time. A patch bump refreshes the npmjs.com listing.

**Files:**
- Modify: `cli/package.json` (version only)

- [ ] **Step 1: Bump the version**

In `cli/package.json`, find:

```json
  "version": "0.1.1",
```

Replace with:

```json
  "version": "0.1.2",
```

- [ ] **Step 2: Commit the bump**

```bash
git add cli/package.json
git commit -m "chore(cli): 0.1.2 — README describes password auth"
```

- [ ] **Step 3: Push main (so the degit template source is current before the npm listing points at it)**

```bash
git push origin main
```

- [ ] **Step 4: Publish (may need user interaction)**

```bash
cd cli && npm publish
```

Expected: `+ @michaelreik/create-vibe-app@0.1.2`. The package has `publishConfig.access: public`, so no `--access` flag is needed. If npm asks for a 2FA one-time password or login, STOP and ask the user — do not retry blindly.

- [ ] **Step 5: Verify the listing**

```bash
npm view @michaelreik/create-vibe-app version
```

Expected: `0.1.2`. (The README on npmjs.com can take a few minutes to re-render; the version number is the proof.)
