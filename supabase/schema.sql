-- Tirat Carmel appointment booking - Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------
create table if not exists departments (
  id                   text primary key,
  name                 text not null,
  address              text not null,
  phone                text not null,
  contact_name         text,
  email                text not null,
  slot_duration_minutes integer not null default 15,
  -- 0 = Sunday .. 6 = Saturday (matches JS Date#getDay())
  work_days            integer[] not null default '{0,1,2,3,4}',
  work_start_time      time not null default '08:00',
  work_end_time        time not null default '15:00',
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table if not exists appointments (
  id               uuid primary key default gen_random_uuid(),
  department_id    text not null references departments(id),
  appointment_date date not null,
  start_time       time not null,
  status           text not null default 'held'
                     check (status in ('held', 'confirmed', 'cancelled')),
  holder_id        uuid not null default gen_random_uuid(),
  expires_at       timestamptz not null,
  name             text,
  phone            text,
  email            text,
  reason           text,
  code             text,
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz
);

-- A slot can only be held by one non-cancelled row at a time. This is what
-- actually prevents double-booking under concurrent requests (the browser
-- localStorage "shared storage" in the prototype could not guarantee this).
create unique index if not exists appointments_active_slot_idx
  on appointments (department_id, appointment_date, start_time)
  where status <> 'cancelled';

create index if not exists appointments_lookup_idx
  on appointments (phone, code)
  where status = 'confirmed';

create index if not exists appointments_admin_list_idx
  on appointments (department_id, appointment_date, start_time)
  where status = 'confirmed';

-- ---------------------------------------------------------------------------
-- Row Level Security: the app only ever talks to Supabase using the
-- server-only service role key (which bypasses RLS), so deny all access
-- from the public/anon key outright.
-- ---------------------------------------------------------------------------
alter table departments enable row level security;
alter table appointments enable row level security;

-- ---------------------------------------------------------------------------
-- Seed data - sample departments for Tirat Carmel municipality.
-- Replace name/address/phone/email with the real values before going live.
-- ---------------------------------------------------------------------------
insert into departments (id, name, address, phone, contact_name, email, work_start_time, work_end_time)
values
  ('business-licensing', 'רישוי עסקים',              'רחוב העצמאות 1, טירת כרמל', '04-8500111', 'רחל כהן',   'business-licensing@tirat-carmel.muni.il', '08:00', '15:00'),
  ('engineering',        'הנדסה ותכנון עיר',          'רחוב העצמאות 1, טירת כרמל', '04-8500222', 'דוד לוי',    'engineering@tirat-carmel.muni.il',        '08:00', '15:00'),
  ('billing',            'גבייה וארנונה',              'רחוב העצמאות 1, טירת כרמל', '04-8500333', 'מירי אברהם', 'billing@tirat-carmel.muni.il',            '08:00', '15:00'),
  ('welfare',            'רווחה ושירותים חברתיים',     'רחוב הרצל 5, טירת כרמל',    '04-8500444', 'יעל מזרחי',  'welfare@tirat-carmel.muni.il',            '08:00', '15:00'),
  ('education',          'רישום לגני ילדים וחינוך',    'רחוב הרצל 5, טירת כרמל',    '04-8500555', 'שרה בן דוד', 'education@tirat-carmel.muni.il',          '08:00', '15:00'),
  ('environment',        'שפ"ע - איכות סביבה ותברואה', 'רחוב העצמאות 1, טירת כרמל', '04-8500666', 'משה פרץ',    'environment@tirat-carmel.muni.il',        '08:00', '15:00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- transcription_jobs - Hebrew audio transcription with speaker diarization.
-- Uploads land in the `recordings` storage bucket; a separate worker process
-- (transcription_worker/, run on your own machine/server - not Vercel, ASR +
-- diarization are too heavy for serverless functions) picks up 'pending' jobs,
-- transcribes them and writes the result back here.
-- ---------------------------------------------------------------------------
create table if not exists transcription_jobs (
  id                 uuid primary key default gen_random_uuid(),
  original_filename  text not null,
  storage_bucket     text not null default 'recordings',
  storage_path       text not null,
  status             text not null default 'pending_upload'
                       check (status in ('pending_upload', 'pending', 'processing', 'done', 'failed')),
  progress_stage     text,
  progress_percent   integer not null default 0,
  error_message      text,
  duration_seconds   numeric,
  -- { "segments": [{ "start": 12.3, "end": 18.9, "speaker": "SPEAKER_00", "text": "..." }, ...],
  --   "speakers": ["SPEAKER_00", "SPEAKER_01"] }
  transcript         jsonb,
  -- { "SPEAKER_00": "יוסי כהן", "SPEAKER_01": "דובר 2" } - seeded by the worker's
  -- best-effort name guess from self-introductions in the transcript, editable
  -- from the admin screen afterwards.
  speaker_names      jsonb not null default '{}'::jsonb,
  claimed_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists transcription_jobs_status_idx
  on transcription_jobs (status, created_at);

alter table transcription_jobs enable row level security;

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded recordings. Private - only the service role
-- (server + worker) can read/write; the browser only ever gets short-lived
-- signed URLs. Files can be large (a 3-4 hour recording is easily 100+ MB),
-- so make sure Project Settings -> Storage -> "Max file size" is raised
-- above the default 50 MB.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;
