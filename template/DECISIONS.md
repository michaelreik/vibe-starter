# Architecture Decisions

Lightweight ADR log. Append-only — when a decision is reversed, add a new
entry that supersedes the old one rather than editing history.

Format per entry:

```
## YYYY-MM-DD — Short title

**Status:** active | superseded by <date>

**Context:** What problem are we solving?

**Decision:** What did we decide?

**Why:** Reasoning. Why this and not the alternatives?

**Trade-off:** What we give up by choosing this.
```

---

## 2026-04-30 — Use @supabase/ssr instead of @supabase/auth-helpers-nextjs

**Status:** active

**Context:** Need a Supabase client that works correctly with Next.js App Router (Server Components, Server Actions, Route Handlers, Middleware).

**Decision:** Use `@supabase/ssr`.

**Why:** `@supabase/auth-helpers-nextjs` is officially deprecated. Supabase recommends `@supabase/ssr` for all new projects.

**Trade-off:** Slightly more boilerplate (we manage cookie reading/writing ourselves) — but it's the supported path.

## 2026-04-30 — Magic-link auth as the default, no passwords

**Status:** active

**Context:** Need user authentication that's secure, low-friction, and doesn't require us to handle password recovery flows.

**Decision:** Magic-link sign-in via Supabase Auth.

**Why:** Zero password-management code, no "forgot password" flow, fewer security pitfalls. Good UX on mobile (tap a link in your inbox).

**Trade-off:** Users must have an email client open to sign in. Could add OAuth (Google, GitHub) later if needed.

## 2026-04-30 — profiles.email is nullable

**Status:** active

**Context:** `auth.users.email` can be NULL for phone-only OTP signups, anonymous sign-ins, and some OAuth providers. The `handle_new_user` trigger inserts `new.email` directly into `profiles.email`.

**Decision:** Allow `profiles.email` to be NULL.

**Why:** A `NOT NULL` constraint causes the trigger to abort signup with a constraint violation when email is null at the auth.users level — silently breaking phone/anonymous auth before vibe coders even know it's an option.

**Trade-off:** Application code that displays an email must handle the null case (`profile.email ?? user.email ?? ""`).

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
