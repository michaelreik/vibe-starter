---
name: deploy-to-production
description: Verify locally, commit, push to main, wait for Vercel, smoke-check the live URL. Use when the user types /ship, says "deploy this", or says "let's go live with what we have".
---

# deploy-to-production Skill

You're shipping the current branch to production. The user trusts you to
not break the live app. Be paranoid in the verify step; be brief in the
report.

## When to invoke

- `/ship` slash command.
- User says "ship this", "deploy", "push to prod".

## Pre-flight check

### 1. Are we set up?

If `.vibe-state.json` is missing or `vercel_url` is unset, the project hasn't
been onboarded yet — recommend `/setup` first and stop.

### 2. Is the working tree in a sane state?

```bash
git status
```

If unrelated uncommitted work is present, ask the user: "There are changes
not part of the feature you want to ship — should I commit them too, stash
them, or stop?" Don't auto-include random changes in the deploy commit.

### 3. Local verification

All four must exit 0 — fix in place if any fail before continuing:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

If `npm run build` needs env vars and `.env.local` is missing, the user
hasn't set up local Supabase. That's fine for production deploys — the
real env vars live in Vercel — but you'll have to skip local build and
trust the Vercel build instead. Note this to the user.

## Deploy

### 4. Commit any pending changes

If the user's feature work isn't committed yet, commit it now (if they
confirmed in step 2). Use a meaningful message:

```bash
git -c commit.gpgsign=false commit -m "feat: <short description>"
```

### 5. Push to main

The Vercel project is wired to deploy on push to `main`. If you're on a
feature branch, ask the user how to merge:
- "Fast-forward merge to main and push?" (default for solo work)
- "Open a PR for review?" (if there are reviewers)

For solo: 

```bash
git checkout main
git merge --ff-only <feature-branch>
git push origin main
git checkout <feature-branch>  # restore branch
```

For PR: `gh pr create --fill --base main` and stop here — let CI/Vercel preview run, then the user merges manually.

### 6. Wait for Vercel deploy

After push to main:

```bash
sleep 30  # give Vercel a head-start
vercel inspect <vercel_url> --wait
```

Or simpler: poll with `curl` every 15s until 200:

```bash
for i in {1..20}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" https://<vercel_url>)
  if [ "$status" = "200" ]; then break; fi
  sleep 15
done
```

If after 5 minutes the URL still 5xxs or 404s, surface to the user — the
Vercel build probably failed. Tell them to check `https://vercel.com/dashboard`.

### 7. Smoke check the live URL

```bash
curl -sI https://<vercel_url> | head -5
curl -sI https://<vercel_url>/login | head -5
```

Both should return 200 (or 308/307 for the root redirect, depending on auth state).

### 8. Update PROGRESS.md

Invoke `update-progress`. Add an entry to "Built So Far":

```
- YYYY-MM-DD: deployed <feature> — <vercel_url>
```

### 9. Report

Three lines, no fluff:

```
✓ Deployed
  Commit: <sha>
  Live:   https://<vercel_url>
```

## Edge cases

- **Build fails locally**: do NOT push. Fix first.
- **Build passes locally but fails on Vercel**: usually env-var related — check that all `.env.example` keys exist as Vercel env vars (`vercel env ls`).
- **DB schema drift**: if the Supabase remote DB is missing recent migrations, run `npx supabase db push` BEFORE the Vercel deploy, otherwise the live app crashes against an old schema.
- **First deploy after a custom-domain change**: the magic-link `NEXT_PUBLIC_SITE_URL` env var must match the new domain — invoke `add-custom-domain` skill (Plan 4) if you didn't already.

## What you do NOT do

- Force-push to `main`.
- Skip tests because "they're flaky".
- Deploy without a smoke check on the live URL.
- Push secrets in a hurry — `git status` should be clean before push.
