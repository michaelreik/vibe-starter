# Magic-link cleanup — design

**Date:** 2026-06-11
**Status:** approved by Michael

## Background

Commit `600d9b4` switched the template's default auth to email + password and
removed magic-link sign-in from the app code. The login page
(`template/app/(auth)/login/page.tsx`) is email + password, and the
`setup-project` skill (Stage 5d) seeds an admin user during `/setup`: it asks
for an admin email, generates a strong password, shows it once, and creates
the user pre-confirmed via the Supabase Admin API.

That switch left stale magic-link references in tests, docs, and skills that
contradict the current behavior. This cleanup removes them. **No behavior
changes** — login stays email + password, the setup flow stays as is
(admin email asked during setup, password auto-generated and shown once).

## Decisions confirmed with Michael

- **Login identifier:** email (no separate username — Supabase auth is
  email-based natively; zero extra machinery).
- **Password at setup:** keep auto-generated (shown once, user confirms saved).
- **npm package:** README-only patch publish; CLI code untouched.

## Scope

### 1. Fix the broken e2e test

`template/tests/e2e/auth.spec.ts` — the second test still fills only an email
and clicks a "Send magic link" button that no longer exists. Rewrite it for
the password form: fill email + password, click "Sign in", expect an error
toast for bogus credentials (proves the form wires through to Supabase).

### 2. Update docs that advertise magic link as current

- `README.md` (root) — lines describing "magic-link sign-in" /
  "Supabase magic-link auth" → email + password auth, admin user seeded
  during `/setup`.
- `cli/README.md:34` — "Supabase auth (magic link)" → email + password,
  admin seeded at setup.
- `template/.env.example:19` — comment "used in magic-link redirects" →
  used in auth-email redirects (password reset, invites) and anywhere
  `siteUrl` is referenced.
- `template/next.config.ts:5` — stale comment about the magic-link cookie;
  reword to describe the actual reason (sign-in tested against 127.0.0.1).

### 3. Reword skills that reference magic-link flows

The underlying instructions (redirect URLs, SMTP, site_url) remain valid for
auth emails generally; only the wording changes.

- `add-custom-domain/SKILL.md` — 4 references: "magic-link sign-in/callbacks/
  emails" → "auth emails (password reset, invites)" / "password sign-in" for
  the post-change verification step.
- `add-email/SKILL.md` — 3 references: route "auth emails" (not "magic-link
  emails") through Resend; test via password-reset email instead of magic-link
  sign-in.
- `debug-supabase/SKILL.md` — branch C "Magic link: I never get the email" →
  "Auth emails (password reset, invites) never arrive".
- `deploy-to-production/SKILL.md:133` — reword the `NEXT_PUBLIC_SITE_URL`
  note without "magic-link".

### 4. Leave history alone

`template/CHANGELOG.md`, `template/DECISIONS.md`, `MAINTAINER/` specs and
plans keep their magic-link mentions — they are records, not instructions.
`template/supabase/config.toml:207` is a Supabase-generated comment — leave.

### 5. Housekeeping: committed test artifacts

`template/test-results/` and `template/playwright-report/` are committed
Playwright artifacts (some from the magic-link era). Delete from git and add
both to `template/.gitignore`. (The CLI already skips them when copying from
a local source — `LOCAL_COPY_SKIP` in `cli/src/scaffold.js`.)

### 6. npm patch release

The CLI pulls the template fresh from GitHub via degit at scaffold time, so
template fixes need no npm release. Only the package README is stale on
npmjs.com. After the README fix: bump `cli/package.json` to `0.1.2` and
`npm publish` from `cli/` (public, scoped `@michaelreik/create-vibe-app`).

## Testing

- `npx playwright test` in `template/` — both auth e2e tests pass against a
  local Supabase + dev server (per existing playwright.config.ts).
- `npm run build` in `template/` still passes (no code changes expected to
  affect it, but it's the project's pre-push gate).
- Grep check: no remaining "magic" references outside CHANGELOG, DECISIONS,
  MAINTAINER/, and config.toml.

## Out of scope

- Any change to the login page, auth actions, or setup-project skill — they
  already implement the desired behavior.
- Username-based login (explicitly declined — email is the login id).
