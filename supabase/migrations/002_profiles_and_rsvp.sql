-- ============================================================
-- 002: Profiles table + auth trigger + RSVP phone-only dedup
-- ============================================================

-- ---- profiles ----
create table profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text,
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- Any authenticated user can read profiles (needed for team member names)
create policy "authenticated users can read profiles"
  on profiles for select using (auth.uid() is not null);

-- Users can update only their own profile
create policy "users can update own profile"
  on profiles for update using (auth.uid() = user_id);

-- Trigger: auto-create a profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles(user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---- RSVP: prevent duplicate phone-only submissions ----
-- PostgreSQL UNIQUE constraints treat NULL = NULL as not-equal, so a plain
-- UNIQUE(wedding_id, email) allows unlimited phone-only rows. This partial
-- index closes that gap for submissions that have a phone but no email.
create unique index rsvp_submissions_phone_no_email
  on rsvp_submissions(wedding_id, phone)
  where email is null and phone is not null;
