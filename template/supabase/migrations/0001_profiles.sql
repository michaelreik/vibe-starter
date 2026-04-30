-- Profiles table: 1-to-1 with auth.users, holds user-editable fields.
-- Created automatically on signup via trigger.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data per user (1:1 with auth.users).';

-- Trigger: keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger: auto-create a profile row when a new auth.users row is inserted.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: locked down by default, every access must be explicit.
alter table public.profiles enable row level security;

-- Policy: users can read their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: users can update their own profile.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy: profiles are inserted by the trigger only.
-- No DELETE policy: profiles are deleted via auth.users cascade.
