---
name: add-rls-policy
description: Audit RLS coverage on existing tables and add missing policies. Use when reviewing security, when add-feature wires queries against a table whose policies are incomplete, or when the user asks "is my data safe?".
---

# add-rls-policy Skill

Adding RLS policies to a table that already exists. The table may have
been created without proper coverage, or the feature you're adding needs
a different policy (e.g., reading shared data).

## When to invoke

- User asks "is `<table>` secure?" / "check RLS on `<table>`".
- `add-feature` query patterns require policies the table doesn't have yet.
- After importing migrations from another project.

## Steps

### 1. Audit the current state

For each table in scope:

```bash
docker exec supabase_db_template psql -U postgres -d postgres -c \
  "select c.relname,
          c.relrowsecurity as rls_enabled,
          (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
   order by c.relname"
```

For tables with `rls_enabled = f` or `policy_count = 0`: STOP and warn the user that the table is currently a wide-open data leak. Do not proceed with adding application logic against this table until RLS is on.

### 2. Determine the required policies

Ask the user what access pattern the feature needs:
- Each user sees only their own rows? → 4 policies, `auth.uid() = user_id`
- Anyone can read, owner can edit? → SELECT `using (true)`, others `auth.uid() = user_id`
- Team-scoped? → policies use `exists (...)` against a `team_members` table
- Admin-only writes? → policies use `auth.jwt()->>'role' = 'admin'` or similar custom claim

If unclear, present the 3 most likely options as A/B/C and let the user pick.

### 3. Write the migration

Create a new migration file (next number, e.g., `000N_<table>_rls.sql`). Use the template:

```sql
-- Enable RLS (no-op if already on, but explicit for migrations)
alter table public.<table> enable row level security;

-- Drop any pre-existing policies you're replacing (optional, for cleanup)
-- drop policy if exists "<old_policy_name>" on public.<table>;

create policy "<table>_select_own"
  on public.<table> for select
  using (auth.uid() = user_id);

-- ... and so on for the policies you need
```

### 4. Apply and verify

```bash
npx supabase db reset
```

Then re-run the audit query from Step 1 — confirm RLS is on and policy count matches expectations.

### 5. Quick smoke test (optional but recommended)

If the table has data, verify policies actually scope correctly:

```bash
# As anonymous (no JWT) — should return 0 rows
docker exec supabase_db_template psql -U postgres -d postgres -c \
  "set request.jwt.claims to '{\"role\":\"anon\"}'; select count(*) from public.<table>;"

# As an authenticated user — should return that user's rows
docker exec supabase_db_template psql -U postgres -d postgres -c \
  "set request.jwt.claims to '{\"role\":\"authenticated\",\"sub\":\"<some-user-id>\"}'; select count(*) from public.<table>;"
```

If the second query returns rows belonging to OTHER users, the policy is wrong.

### 6. Push to remote and commit

```bash
npx supabase db push  # only if linked
git add supabase/migrations/
git -c commit.gpgsign=false commit -m "feat(db): RLS policies for <table>"
```

## Edge cases

- **Table already had policies** with conflicting names: drop them in the migration before re-creating.
- **Policies should differ between SELECT and INSERT** (e.g., users insert as themselves but can read team data): use multiple separate policies — Postgres ORs them within a command.
- **`auth.uid()` returns null** in your test query: the test is running without a JWT. Set the JWT claims first (see Step 5).

## What you do NOT do

- Disable RLS as a workaround. Never.
- Use `using (true)` on INSERT/UPDATE/DELETE — that's "anyone can write any row", which is almost always wrong.
- Skip the verify step. RLS bugs are silent — they don't error, they just leak data.
