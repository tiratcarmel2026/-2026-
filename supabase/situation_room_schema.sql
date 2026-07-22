-- Tirat Carmel emergency situation room ("חמ"ל") - Supabase schema
-- Run this once in the Supabase SQL editor, after supabase/schema.sql.
--
-- This powers /matzav (public display screen) and /admin/matzav (backend
-- console). The display screen reads these tables directly over Supabase
-- Realtime using the anon key (read-only, see RLS policies below); every
-- write goes through server API routes using the service role key.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- situation_status: singleton row with the current headline numbers and the
-- state of the Home Front Command feed integration.
-- ---------------------------------------------------------------------------
create table if not exists situation_status (
  id                    integer primary key default 1 check (id = 1),
  alert_active          boolean not null default false,
  alert_started_at      timestamptz,
  alert_message         text,
  fatalities_count      integer not null default 0,
  injured_severe_count  integer not null default 0,
  injured_moderate_count integer not null default 0,
  injured_light_count   integer not null default 0,
  missing_count         integer not null default 0,
  shelters_open_count   integer not null default 0,
  headline              text,
  -- state of the (unofficial) oref.org.il polling integration, surfaced on
  -- the display so viewers know if the automatic feed is currently working
  oref_feed_status      text not null default 'unknown'
                          check (oref_feed_status in ('unknown', 'ok', 'error')),
  oref_last_checked_at  timestamptz,
  oref_last_success_at  timestamptz,
  updated_at            timestamptz not null default now(),
  updated_by            text
);

insert into situation_status (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- oref_alerts: raw log of Home Front Command alerts matched to Tirat Carmel,
-- pulled from the unofficial oref.org.il feed. Kept as an audit trail.
-- ---------------------------------------------------------------------------
create table if not exists oref_alerts (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique,
  category      text,
  title         text,
  description   text,
  matched_area  text,
  raw           jsonb,
  received_at   timestamptz not null default now()
);

create index if not exists oref_alerts_received_idx on oref_alerts (received_at desc);

-- ---------------------------------------------------------------------------
-- incidents: specific field-reported events (rocket impact, fire, damage,
-- road closure...) with a location, shown as markers on the city map.
-- ---------------------------------------------------------------------------
create table if not exists incidents (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  status           text not null default 'active'
                     check (status in ('active', 'monitoring', 'resolved')),
  severity         text not null default 'medium'
                     check (severity in ('low', 'medium', 'high', 'critical')),
  lat              double precision,
  lng              double precision,
  address          text,
  fatalities_count integer not null default 0,
  injured_count    integer not null default 0,
  needs            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       text,
  updated_by       text
);

create index if not exists incidents_status_idx on incidents (status, created_at desc);

-- ---------------------------------------------------------------------------
-- situation_notes: chronological log / updates feed ("יומן אירועים").
-- ---------------------------------------------------------------------------
create table if not exists situation_notes (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  author      text,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists situation_notes_created_idx on situation_notes (pinned desc, created_at desc);

-- ---------------------------------------------------------------------------
-- resource_needs: requested resources/needs checklist ("צרכים ומשאבים").
-- ---------------------------------------------------------------------------
create table if not exists resource_needs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  quantity    text,
  status      text not null default 'needed'
                check (status in ('needed', 'in_progress', 'fulfilled')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- important_contacts: editable list of key phone numbers for the display.
-- ---------------------------------------------------------------------------
create table if not exists important_contacts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  category    text not null default 'general',
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- camera_feeds: optional live-view embeds ("עיניים בחוץ"). Empty by default -
-- there is no real municipal camera integration here, this only gives the
-- admin console a place to paste an embeddable stream URL (HLS/iframe) if
-- and when the municipality's actual CCTV system exposes one.
-- ---------------------------------------------------------------------------
create table if not exists camera_feeds (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location    text,
  stream_url  text not null,
  lat         double precision,
  lng         double precision,
  active      boolean not null default true,
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- Server API routes always use the service role key (bypasses RLS) for
-- writes. The public display screen (/matzav) connects directly with the
-- anon key so it can receive Supabase Realtime updates - it is granted
-- read-only SELECT and nothing else.
-- ---------------------------------------------------------------------------
alter table situation_status    enable row level security;
alter table oref_alerts         enable row level security;
alter table incidents           enable row level security;
alter table situation_notes     enable row level security;
alter table resource_needs      enable row level security;
alter table important_contacts  enable row level security;
alter table camera_feeds        enable row level security;

create policy "public read situation_status" on situation_status for select using (true);
create policy "public read oref_alerts" on oref_alerts for select using (true);
create policy "public read incidents" on incidents for select using (true);
create policy "public read situation_notes" on situation_notes for select using (true);
create policy "public read resource_needs" on resource_needs for select using (true);
create policy "public read important_contacts" on important_contacts for select using (true);
create policy "public read camera_feeds" on camera_feeds for select using (true);

-- ---------------------------------------------------------------------------
-- Realtime: publish changes on these tables so the display screen updates
-- live without a page refresh.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table situation_status;
alter publication supabase_realtime add table oref_alerts;
alter publication supabase_realtime add table incidents;
alter publication supabase_realtime add table situation_notes;
alter publication supabase_realtime add table resource_needs;
alter publication supabase_realtime add table important_contacts;
alter publication supabase_realtime add table camera_feeds;

-- ---------------------------------------------------------------------------
-- Seed data - well-known Israeli emergency numbers + the municipal hotline.
-- Safe to keep as-is; edit freely from the admin console afterwards.
-- ---------------------------------------------------------------------------
insert into important_contacts (name, phone, category, sort_order) values
  ('משטרה',                 '100',         'emergency', 1),
  ('מגן דוד אדום',           '101',         'emergency', 2),
  ('כיבוי והצלה',            '102',         'emergency', 3),
  ('פיקוד העורף',            '104',         'emergency', 4),
  ('מוקד עיריית טירת כרמל',  '106',         'municipal', 5),
  ('חברת חשמל - תקלות',      '103',         'utilities', 6)
on conflict do nothing;
