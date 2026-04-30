---
name: add-supabase-table
description: Generate a new Supabase migration for a user-owned table with the canonical 4-policy RLS pattern. Applies the migration locally and pushes to the linked remote project. Use when /new-table is invoked or when add-feature needs a new table.
---

# add-supabase-table Skill

You are creating a new database table with proper Row Level Security from
the start. Every user-owned table in this project follows the same pattern;
your job is to apply it correctly.

## When to invoke

- `/new-table <name>` slash command.
- `add-feature` skill needs a new table.
- User says "add a `<X>` table".

## Required inputs (ask if not provided)

1. **Table name** — snake_case, plural (e.g., `recipes`, `comments`, `task_lists`).
2. **Columns** — name + type for each domain field. Standard columns are added automatically (`id`, `user_id`, `created_at`, `updated_at`).
3. **Foreign keys** — does this table reference others (e.g., `comments.recipe_id → recipes.id`)?
4. **Ownership model** — almost always `user_id references auth.users(id)`. If it's a join table or has a different ownership story (team-owned, public-readable), surface it and confirm.

## Steps

### 1. Pick the next migration number

```bash
ls supabase/migrations/ | sort -n
```

Take the highest existing prefix and add 1, padded to 4 digits. So if the latest is `0002_notes.sql`, the new one is `0003_<table_name>.sql`.

### 2. Write the migration

Use this template — fill in `<placeholders>` and adjust columns. **Do not skip RLS.**

```sql
-- <Table name>: <one-line description>.

create table public.<table_name> (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- domain columns:
  <name>      <type> [not null] [default <value>],
  -- ...
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index <table_name>_user_id_idx on public.<table_name> (user_id);
-- Add more indexes here if needed for sorting/filtering.

comment on table public.<table_name> is '<one-line purpose>';

create trigger <table_name>_set_updated_at
  before update on public.<table_name>
  for each row execute function public.set_updated_at();

alter table public.<table_name> enable row level security;

create policy "<table_name>_select_own"
  on public.<table_name> for select
  using (auth.uid() = user_id);

create policy "<table_name>_insert_own"
  on public.<table_name> for insert
  with check (auth.uid() = user_id);

create policy "<table_name>_update_own"
  on public.<table_name> for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "<table_name>_delete_own"
  on public.<table_name> for delete
  using (auth.uid() = user_id);
```

For a foreign key to another user-owned table (e.g., `comments.recipe_id`):
- Add `recipe_id uuid not null references public.recipes (id) on delete cascade`.
- Add an index: `create index <table_name>_recipe_id_idx on public.<table_name> (recipe_id);`.
- The RLS pattern remains `auth.uid() = user_id` (not the parent's user). You can layer additional policies later if needed.

### 3. Apply locally and verify

```bash
npx supabase db reset
```

Expected: applies all migrations cleanly. Watch for errors specific to your new file.

Verify RLS + 4 policies:

```bash
docker exec supabase_db_template psql -U postgres -d postgres -c \
  "select polname, polcmd from pg_policy where polrelid = 'public.<table_name>'::regclass order by polname"
```

Expected: 4 rows — `<name>_select_own` (r), `<name>_insert_own` (a), `<name>_update_own` (w), `<name>_delete_own` (d).

### 4. Push to remote (only if linked)

If `.vibe-state.json.supabase_project_ref` is set (project is linked to a remote Supabase):

```bash
npx supabase db push
```

If not linked yet, that's fine — the migration is committed and will run on the next `db push` (typically by the `setup-project` skill or the user manually).

### 5. Regenerate TypeScript types (if used)

If the project has `lib/database.types.ts` (auto-generated Supabase types):

```bash
npx supabase gen types typescript --linked > lib/database.types.ts
```

If the file doesn't exist yet, this step is optional — the project can run without it (Supabase queries are loosely typed).

### 6. Commit

```bash
git add supabase/migrations/000N_<table>.sql lib/database.types.ts
git -c commit.gpgsign=false commit -m "feat(db): <table_name> table with RLS"
```

## Edge cases

- **Table name conflicts** with an existing public-schema table: pause and ask the user (rename, or alter existing).
- **Migration apply fails** with a SQL error: print the error verbatim to the user. Do not silently work around schema issues.
- **User wants public-readable rows** (e.g., a "shared recipes" table): drop the `select_own` policy and add `create policy "<name>_select_all" on public.<name> for select using (true);` instead. INSERT/UPDATE/DELETE still scoped to owner.
- **Junction / many-to-many table**: usually no `user_id` directly; ownership flows from the joined tables. RLS uses `exists (...)` subqueries — surface the design and confirm before writing.

## What you do NOT do

- Ship a table without RLS. Ever.
- Edit an already-applied migration — always create a new one.
- Add columns the user didn't ask for "for completeness".
