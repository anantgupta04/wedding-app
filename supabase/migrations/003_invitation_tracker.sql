-- ============================================================
-- INVITATION TRACKER
-- ============================================================

create table invitation_cards (
  id              uuid primary key default uuid_generate_v4(),
  wedding_id      uuid not null references weddings(id) on delete cascade,
  family_name     text not null,
  side            text not null default 'groom' check (side in ('groom', 'bride', 'both')),
  estimated_count int  not null default 1,
  status          text not null default 'not_contacted'
                       check (status in ('not_contacted', 'called', 'invite_sent', 'confirmed')),
  notes           text,
  created_at      timestamptz not null default now()
);

create table invitation_contacts (
  id         uuid primary key default uuid_generate_v4(),
  card_id    uuid not null references invitation_cards(id) on delete cascade,
  label      text,
  phone      text,
  email      text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table invitation_cards    enable row level security;
alter table invitation_contacts enable row level security;

-- ---- invitation_cards ----
create policy "members can view invitation cards"
  on invitation_cards for select using (is_member(wedding_id));

create policy "editors and admins can insert invitation cards"
  on invitation_cards for insert with check (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can update invitation cards"
  on invitation_cards for update using (member_role(wedding_id) in ('admin','editor'));

create policy "editors and admins can delete invitation cards"
  on invitation_cards for delete using (member_role(wedding_id) in ('admin','editor'));

-- ---- invitation_contacts ----
create policy "members can view invitation contacts"
  on invitation_contacts for select using (
    exists (
      select 1 from invitation_cards c
      where c.id = card_id and is_member(c.wedding_id)
    )
  );

create policy "editors and admins can insert invitation contacts"
  on invitation_contacts for insert with check (
    exists (
      select 1 from invitation_cards c
      where c.id = card_id and member_role(c.wedding_id) in ('admin','editor')
    )
  );

create policy "editors and admins can update invitation contacts"
  on invitation_contacts for update using (
    exists (
      select 1 from invitation_cards c
      where c.id = card_id and member_role(c.wedding_id) in ('admin','editor')
    )
  );

create policy "editors and admins can delete invitation contacts"
  on invitation_contacts for delete using (
    exists (
      select 1 from invitation_cards c
      where c.id = card_id and member_role(c.wedding_id) in ('admin','editor')
    )
  );
