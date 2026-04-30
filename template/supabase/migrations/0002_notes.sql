-- Notes: example user-owned content with full RLS.
-- This table demonstrates the pattern for any "user has many X" feature.

create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notes_user_id_idx on public.notes (user_id);

comment on table public.notes is 'Example: each note belongs to one user. Demonstrates RLS pattern.';

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

-- Users see only their own notes.
create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

-- Users insert notes only as themselves (cannot forge user_id).
create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

-- Users update only their own notes.
create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users delete only their own notes.
create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);
