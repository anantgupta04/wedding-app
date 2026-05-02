-- ============================================================
-- Wedding App — Initial Schema + RLS Policies
-- Run this in Supabase SQL Editor or via Supabase CLI
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE
-- ============================================================

create table weddings (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null unique,
  name       text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  currency   text not null default 'INR',
  date       date,
  created_at timestamptz not null default now()
);

create table wedding_members (
  id         uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'editor', 'viewer')),
  invited_by uuid references auth.users(id),
  joined_at  timestamptz not null default now(),
  unique(wedding_id, user_id)
);

-- ============================================================
-- EVENTS
-- ============================================================

create table events (
  id            uuid primary key default uuid_generate_v4(),
  wedding_id    uuid not null references weddings(id) on delete cascade,
  name          text not null,
  date          date,
  time          time,
  venue         text,
  venue_map_url text,
  dress_code    text,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- GUESTS
-- ============================================================

create table guests (
  id                  uuid primary key default uuid_generate_v4(),
  wedding_id          uuid not null references weddings(id) on delete cascade,
  name                text not null,
  email               text,
  phone               text,
  side                text check (side in ('bride', 'groom', 'mutual')),
  has_plus_one        boolean not null default false,
  plus_one_name       text,
  plus_one_dietary    text,
  dietary             text[] not null default '{}',
  accommodation       boolean not null default false,
  accommodation_notes text,
  table_id            uuid, -- FK added after tables table is created
  notes               text,
  created_at          timestamptz not null default now()
);

create index idx_guests_wedding_email on guests(wedding_id, email);

create table guest_events (
  id          uuid primary key default uuid_generate_v4(),
  guest_id    uuid not null references guests(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  invited     boolean not null default true,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'yes', 'no')),
  response_date timestamptz,
  unique(guest_id, event_id)
);

-- ============================================================
-- RSVP
-- ============================================================

create table rsvp_submissions (
  id               uuid primary key default uuid_generate_v4(),
  wedding_id       uuid not null references weddings(id) on delete cascade,
  guest_id         uuid references guests(id) on delete set null,
  name             text not null,
  email            text,
  phone            text,
  attending        boolean not null,
  dietary          text[] not null default '{}',
  plus_one_name    text,
  plus_one_dietary text,
  message          text,
  submitted_at     timestamptz not null default now(),
  -- prevent duplicate submissions from same email per wedding
  unique(wedding_id, email)
);

create table rsvp_event_responses (
  id          uuid primary key default uuid_generate_v4(),
  rsvp_id     uuid not null references rsvp_submissions(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  attending   boolean not null,
  unique(rsvp_id, event_id)
);

-- ============================================================
-- BUDGET
-- ============================================================

create table budget_categories (
  id               uuid primary key default uuid_generate_v4(),
  wedding_id       uuid not null references weddings(id) on delete cascade,
  name             text not null,
  allocated_amount numeric(12,2) not null default 0
);

create table budget_items (
  id          uuid primary key default uuid_generate_v4(),
  wedding_id  uuid not null references weddings(id) on delete cascade,
  category_id uuid not null references budget_categories(id) on delete cascade,
  vendor_id   uuid, -- FK added after vendors table created
  description text not null,
  estimated   numeric(12,2) not null default 0,
  actual      numeric(12,2),
  paid        boolean not null default false
);

-- ============================================================
-- VENDORS
-- ============================================================

create table vendors (
  id               uuid primary key default uuid_generate_v4(),
  wedding_id       uuid not null references weddings(id) on delete cascade,
  category         text not null,
  name             text not null,
  contact_name     text,
  contact_phone    text,
  contact_email    text,
  contract_url     text,
  total_cost       numeric(12,2),
  amount_paid      numeric(12,2) not null default 0,
  payment_due_date date,
  status           text not null default 'shortlisted' check (status in ('shortlisted','booked','paid','completed')),
  notes            text,
  created_at       timestamptz not null default now()
);

-- Add deferred FKs now that tables exist
alter table budget_items add constraint budget_items_vendor_id_fkey
  foreign key (vendor_id) references vendors(id) on delete set null;

-- ============================================================
-- TASKS
-- ============================================================

create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  wedding_id  uuid not null references weddings(id) on delete cascade,
  event_id    uuid references events(id) on delete set null,
  title       text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  due_date    date,
  priority    text not null default 'medium' check (priority in ('high','medium','low')),
  status      text not null default 'todo' check (status in ('todo','in_progress','done')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- SEATING
-- ============================================================

create table tables (
  id         uuid primary key default uuid_generate_v4(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  event_id   uuid references events(id) on delete set null,
  name       text not null,
  shape      text not null default 'round' check (shape in ('round','rect')),
  capacity   int not null default 8,
  position_x numeric(8,2) not null default 0,
  position_y numeric(8,2) not null default 0
);

create table seat_assignments (
  id          uuid primary key default uuid_generate_v4(),
  table_id    uuid not null references tables(id) on delete cascade,
  guest_id    uuid not null references guests(id) on delete cascade,
  seat_number int,
  unique(table_id, seat_number),
  unique(guest_id, table_id)
);

-- Add guests.table_id FK now
alter table guests add constraint guests_table_id_fkey
  foreign key (table_id) references tables(id) on delete set null;

-- ============================================================
-- INVITE
-- ============================================================

create table invite_config (
  id                  uuid primary key default uuid_generate_v4(),
  wedding_id          uuid not null references weddings(id) on delete cascade unique,
  published           boolean not null default false,
  theme_color         text not null default 'gold',
  cover_image_url     text,
  couple_names        text,
  tagline             text,
  story_text          text,
  music_url           text,
  gallery_image_urls  text[] not null default '{}',
  custom_sections     jsonb not null default '[]'::jsonb,
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
alter table weddings           enable row level security;
alter table wedding_members    enable row level security;
alter table events             enable row level security;
alter table guests             enable row level security;
alter table guest_events       enable row level security;
alter table rsvp_submissions   enable row level security;
alter table rsvp_event_responses enable row level security;
alter table budget_categories  enable row level security;
alter table budget_items       enable row level security;
alter table vendors            enable row level security;
alter table tasks              enable row level security;
alter table tables             enable row level security;
alter table seat_assignments   enable row level security;
alter table invite_config      enable row level security;

-- Helper function: is the current user a member of a wedding?
create or replace function is_member(p_wedding_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from wedding_members
    where wedding_id = p_wedding_id and user_id = auth.uid()
  );
$$;

-- Helper function: what role does the current user have in a wedding?
create or replace function member_role(p_wedding_id uuid)
returns text language sql security definer stable as $$
  select role from wedding_members
  where wedding_id = p_wedding_id and user_id = auth.uid()
  limit 1;
$$;

-- ---- weddings ----
create policy "members can view their weddings"
  on weddings for select using (is_member(id));

create policy "authenticated users can create weddings"
  on weddings for insert with check (auth.uid() = created_by);

create policy "admins can update their wedding"
  on weddings for update using (member_role(id) = 'admin');

create policy "admins can delete their wedding"
  on weddings for delete using (member_role(id) = 'admin');

-- ---- wedding_members ----
create policy "members can view membership"
  on wedding_members for select using (is_member(wedding_id));

create policy "admins can insert members"
  on wedding_members for insert with check (member_role(wedding_id) = 'admin');

create policy "admins can update members"
  on wedding_members for update using (member_role(wedding_id) = 'admin');

create policy "admins can remove members"
  on wedding_members for delete using (member_role(wedding_id) = 'admin');

-- ---- events ----
create policy "members can view events"
  on events for select using (is_member(wedding_id));

create policy "editors and admins can manage events"
  on events for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update events"
  on events for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete events"
  on events for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- guests ----
create policy "members can view guests"
  on guests for select using (is_member(wedding_id));

create policy "editors and admins can manage guests"
  on guests for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update guests"
  on guests for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete guests"
  on guests for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- guest_events ----
create policy "members can view guest_events"
  on guest_events for select
  using (exists (select 1 from guests g where g.id = guest_id and is_member(g.wedding_id)));

create policy "editors and admins can manage guest_events"
  on guest_events for insert
  with check (exists (select 1 from guests g where g.id = guest_id and member_role(g.wedding_id) in ('admin','editor')));

create policy "editors and admins can update guest_events"
  on guest_events for update
  using (exists (select 1 from guests g where g.id = guest_id and member_role(g.wedding_id) in ('admin','editor')));

create policy "editors and admins can delete guest_events"
  on guest_events for delete
  using (exists (select 1 from guests g where g.id = guest_id and member_role(g.wedding_id) in ('admin','editor')));

-- ---- rsvp_submissions ----
-- Public can INSERT (guest RSVP form), but cannot SELECT
create policy "anyone can submit an rsvp"
  on rsvp_submissions for insert with check (true);

create policy "members can view rsvp submissions"
  on rsvp_submissions for select using (is_member(wedding_id));

-- ---- rsvp_event_responses ----
create policy "anyone can submit rsvp event responses"
  on rsvp_event_responses for insert with check (true);

create policy "members can view rsvp event responses"
  on rsvp_event_responses for select
  using (exists (select 1 from rsvp_submissions s where s.id = rsvp_id and is_member(s.wedding_id)));

-- ---- budget_categories ----
create policy "members can view budget categories"
  on budget_categories for select using (is_member(wedding_id));

create policy "editors and admins can manage budget categories"
  on budget_categories for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update budget categories"
  on budget_categories for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete budget categories"
  on budget_categories for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- budget_items ----
create policy "members can view budget items"
  on budget_items for select using (is_member(wedding_id));

create policy "editors and admins can manage budget items"
  on budget_items for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update budget items"
  on budget_items for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete budget items"
  on budget_items for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- vendors ----
create policy "members can view vendors"
  on vendors for select using (is_member(wedding_id));

create policy "editors and admins can manage vendors"
  on vendors for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update vendors"
  on vendors for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete vendors"
  on vendors for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- tasks ----
create policy "members can view tasks"
  on tasks for select using (is_member(wedding_id));

create policy "editors and admins can manage tasks"
  on tasks for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update tasks"
  on tasks for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete tasks"
  on tasks for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- tables ----
create policy "members can view tables"
  on tables for select using (is_member(wedding_id));

create policy "editors and admins can manage tables"
  on tables for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update tables"
  on tables for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete tables"
  on tables for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- seat_assignments ----
create policy "members can view seat assignments"
  on seat_assignments for select
  using (exists (select 1 from tables t where t.id = table_id and is_member(t.wedding_id)));

create policy "editors and admins can manage seat assignments"
  on seat_assignments for insert
  with check (exists (select 1 from tables t where t.id = table_id and member_role(t.wedding_id) in ('admin','editor')));

create policy "editors and admins can update seat assignments"
  on seat_assignments for update
  using (exists (select 1 from tables t where t.id = table_id and member_role(t.wedding_id) in ('admin','editor')));

create policy "editors and admins can delete seat assignments"
  on seat_assignments for delete
  using (exists (select 1 from tables t where t.id = table_id and member_role(t.wedding_id) in ('admin','editor')));

-- ---- invite_config ----
-- Public can SELECT published invites (needed for /i/[slug] page)
-- But we use the service client server-side for that, not anon — so no anon SELECT needed here
create policy "members can view invite config"
  on invite_config for select using (is_member(wedding_id));

create policy "admins can manage invite config"
  on invite_config for insert with check (member_role(wedding_id) = 'admin');

create policy "admins can update invite config"
  on invite_config for update using (member_role(wedding_id) = 'admin');
