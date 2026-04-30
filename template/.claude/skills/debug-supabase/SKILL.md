---
name: debug-supabase
description: Decision tree for the most common Supabase auth/RLS/migration bugs. Use when the user reports "auth doesn't work", "I can't see my data", "magic link isn't arriving", "migration won't apply", or any other surprising Supabase behavior.
---

# debug-supabase Skill

You're triaging a Supabase-related problem. Don't guess — use the decision
tree below. The fixes are almost always one of five things; ruling them out
is faster than reading the user's code from scratch.

## When to invoke

- "auth isn't working" / "I can't sign in"
- "I'm logged in but I can't see my data" (RLS issue)
- "magic link email doesn't arrive"
- "migration won't apply" / "DB out of sync"
- "TypeScript types are wrong" (after schema change)

## Decision tree

### A. Auth: works locally, fails in production

Most common cause: env-var mismatch between local and Vercel.

1. Confirm the Vercel env vars match `.env.example` keys:
   ```bash
   vercel env ls
   ```
   Expected: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`. All four must be set for `production`.

2. `NEXT_PUBLIC_SITE_URL` must be the exact production URL (no trailing slash, https). If wrong, the magic-link callback URL in the email is wrong.

3. Supabase auth dashboard → Authentication → URL Configuration → "Site URL" must include the production URL. Add it as a redirect URL too.

4. After changing any of the above, redeploy: `vercel --prod`.

### B. RLS: "I'm signed in but my queries return nothing"

1. Check the session is actually present in the request:
   - In dev tools → Application → Cookies, look for `sb-*` cookies on the request.
   - In server-rendered pages, log `(await supabase.auth.getUser()).data.user` — it should not be null on protected routes.

2. Confirm the middleware ran for the route. Check `middleware.ts` matcher — `/((?!_next/static|_next/image|favicon.ico|...).*)` should cover the route.

3. Check the policy itself:
   ```bash
   docker exec supabase_db_template psql -U postgres -d postgres -c \
     "select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr from pg_policy where polrelid = 'public.<table>'::regclass"
   ```
   The `using` expression should be `auth.uid() = user_id` (or equivalent). If it's hardcoded, broken, or absent — that's the bug.

4. Confirm the row's `user_id` actually matches the signed-in user:
   ```sql
   select user_id from public.<table> where id = '<some-id>';
   -- compare to (await supabase.auth.getUser()).data.user.id
   ```

### C. Magic link: "I never get the email"

1. **Locally**: emails go to Mailpit, not your real inbox. Open `http://127.0.0.1:54324` in a browser. Click the link from there.

2. **In production with Supabase's built-in SMTP**: Supabase's free SMTP has a hard limit of ~3 emails per hour. If you've exceeded it, signups silently fail. Recommend the user invoke the `add-email` skill (Plan 4) to swap to Resend.

3. **Check spam folder.** Supabase free SMTP sends from `noreply@mail.app.supabase.io` — easily spam-flagged on first send.

4. **Confirm email is actually being sent**: Supabase dashboard → Authentication → Logs. If no entry, the request isn't reaching Supabase — likely an env-var issue (see section A).

### D. Migration: "supabase db push" fails or schema is out of sync

1. Local apply first:
   ```bash
   npx supabase db reset
   ```
   If this fails, the migration SQL is broken. Read the error, fix the SQL.

2. If local works but remote refuses:
   ```bash
   npx supabase db diff --linked
   ```
   Shows the drift. Common: someone made a manual change in the Supabase dashboard. Reverse the change in the dashboard and try push again.

3. If totally stuck, last resort: `npx supabase db reset --linked` — DESTRUCTIVE on the remote. Confirm with the user before running. Wipes all data and re-applies migrations.

### E. TypeScript types: stale after schema change

```bash
npx supabase gen types typescript --linked > lib/database.types.ts
```

If `lib/database.types.ts` doesn't exist yet, it's optional — the app runs without it. But if the user had it generated before, regenerate after every schema change.

### F. None of the above

Ask the user to share:
- The exact error message (full text, including stack trace)
- Whether it reproduces locally or only in prod
- Recent changes (last 1-2 commits)

Then triage. Don't shotgun-debug.

## What you do NOT do

- Disable RLS to "see if it works" without re-enabling immediately. RLS-off in production = data leak.
- Run `supabase db reset --linked` without explicit user confirmation.
- Recommend `service_role` key in client code as a "fix" for an RLS issue.
- Tell the user to "just try again" — always identify the actual cause first.
