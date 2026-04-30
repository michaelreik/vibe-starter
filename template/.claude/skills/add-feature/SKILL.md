---
name: add-feature
description: End-to-end skill for adding a new user-facing feature to the project. Plans the data model, generates RLS-correct migrations, writes server actions and UI, runs typecheck/build, and updates PROGRESS.md. Use when the user says "let's build X" or invokes /new-feature.
---

# add-feature Skill

You are adding a new feature on top of the vibe-starter scaffold. The user
described what they want; your job is to ship it cleanly without breaking
the conventions of the project.

## When to invoke

- `/new-feature <description>` slash command.
- User says "let's build…", "add a feature for…", "I want to be able to…".
- User has an entry in `PROGRESS.md` Idea Backlog they want to pick up.

## Always do, in this order

### 1. Read context

Open and read:
- `PROGRESS.md` — what's been built, what's queued, what's open
- `DECISIONS.md` — architectural choices that constrain options
- `AGENTS.md` — Next 16 + Supabase gotchas

If there are obvious conflicts (e.g., user asks for a feature already in "Built So Far"), surface them before planning.

### 2. Plan the feature out loud

Before writing any code, write a short plan in chat:
- What new tables (if any)?
- What columns / relationships?
- What user actions (server actions in `lib/actions/`)?
- What UI surface (pages under `app/(app)/<feature>/`, components under `components/<feature>/`)?
- What's NOT in scope (avoid over-building)?

Then ask 2-3 clarifying questions. Examples:
- "Should this be private to the user, shared with a team, or public?"
- "Do you want to add an index on <column> for sorting?"
- "Should `<x>` be required, or optional with a default?"

Wait for the answers before continuing.

### 3. Execute in this exact order

Each sub-step must succeed before the next starts. Verify with a typecheck
and build at the end of each major piece.

#### 3a. Database (if new table or columns)

For each new table: invoke the **`add-supabase-table`** skill (or follow its
pattern inline if already in context). The skill handles:
- Picking the next migration number
- Writing the SQL with the canonical RLS pattern
- Running `npx supabase db reset` locally to verify

For columns added to an existing table: write a new migration with `alter table … add column …`. Never edit an existing migration that has been pushed.

#### 3b. Server actions

Create `lib/actions/<feature>.ts`. Use the same pattern as `lib/actions/notes.ts`:
- `"use server"` directive at top
- Each action: validate input → check `auth.uid()` via `await supabase.auth.getUser()` → call Supabase → `revalidatePath` and/or `redirect`
- Return `{ error: string }` on failure or redirect/return void on success
- Never trust client-supplied IDs — always check ownership against `auth.uid()` (RLS enforces it too, but defense-in-depth)

#### 3c. UI

Pages under `app/(app)/<feature>/`:
- `page.tsx` — list view
- `new/page.tsx` — create form
- `[id]/page.tsx` — edit/detail view

Use server components for data fetching (`createClient` from `@/lib/supabase/server`). Wrap server actions in client components (e.g., `note-form.tsx` pattern) when you need `useTransition` + `toast` for error feedback.

For navigation buttons use `<Link className={buttonVariants()}>` — `asChild` is not supported on the Button.

Add a nav link in `app/(app)/layout.tsx` if the feature deserves a top-level entry.

#### 3d. Tests

If the feature has interesting logic:
- Unit-test pure helpers via Vitest (`tests/unit/<feature>.test.ts`)
- Add an e2e smoke test if a new auth-protected page exists (`tests/e2e/<feature>.spec.ts`)

For small features (single CRUD on a table), the existing notes e2e and unit tests are reference enough — don't add token tests just to add tests.

#### 3e. Verify

Run in this order — every command must exit 0:
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm test`
4. `npm run build`

If anything fails, fix before moving on.

### 4. Update project memory

Invoke the **`update-progress`** skill. It moves the relevant idea from
Idea Backlog to Built So Far and adds a one-line entry with today's date.

If you made an architecture decision (e.g., chose Supabase Storage over S3, picked
a particular pattern that wasn't obvious), append an entry to `DECISIONS.md`.

### 5. Commit

Make focused commits — one per logical unit:
- `feat(db): <table> table with RLS`
- `feat(<feature>): server actions for create/update/delete`
- `feat(<feature>): list / new / edit UI`
- `docs: PROGRESS for <feature>`

Use `git -c commit.gpgsign=false` if signing is configured but no key is available.

### 6. Optional: deploy

If the user wants the change live, invoke **`deploy-to-production`**. Otherwise just summarize what was built and ask what's next.

## Edge cases

- **User asks for something that needs a third-party integration** (Stripe, Resend, S3, etc.): pause and tell them which on-demand skill (Plan 4) handles it. Don't try to wire integrations from scratch.
- **Feature requires a destructive migration** (drop table, drop column): pause and surface — destructive migrations need user confirmation because they delete data on the linked remote.
- **Feature touches more than 5 files**: still doable, but commit per logical unit so the diff stays reviewable.
- **User asks for "make it work for multiple users"** (teams, organizations): this requires a deeper schema change (`teams`, `team_members`, RLS via team membership). Surface it as a non-trivial change and confirm before proceeding.

## What you do NOT do

- Skip RLS to "make it faster".
- Edit a migration that has been applied to the remote DB.
- Use the service-role key in client code.
- Add error handling for cases that can't happen (e.g., null check on a value RLS guarantees exists).
- Build "kitchen sink" features beyond what was asked.
