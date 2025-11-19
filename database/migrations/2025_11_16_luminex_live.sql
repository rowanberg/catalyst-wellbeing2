-- Luminex Live integration tables
-- Run this against Supabase (Postgres)

create table if not exists public.luminex_activation_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid,
  session_id text,
  event_type text not null,
  status text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_luminex_activation_logs_teacher on public.luminex_activation_logs(teacher_id);
create index if not exists idx_luminex_activation_logs_session on public.luminex_activation_logs(session_id);

create table if not exists public.luminex_security_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid,
  event_type text not null,
  severity text default 'info',
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_luminex_security_logs_teacher on public.luminex_security_logs(teacher_id);
create index if not exists idx_luminex_security_logs_event on public.luminex_security_logs(event_type);

create table if not exists public.luminex_teacher_devices (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  device_id text not null,
  device_metadata jsonb,
  created_at timestamptz not null default now(),
  unique(teacher_id, device_id)
);

create index if not exists idx_luminex_teacher_devices_teacher on public.luminex_teacher_devices(teacher_id);

create table if not exists public.luminex_security_nonces (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  nonce text not null,
  created_at timestamptz not null default now(),
  unique(teacher_id, nonce)
);

-- RLS
alter table public.luminex_activation_logs enable row level security;
alter table public.luminex_security_logs enable row level security;
alter table public.luminex_teacher_devices enable row level security;
alter table public.luminex_security_nonces enable row level security;

-- Devices policies (teachers can manage their own devices)
create policy if not exists "luminex_devices_select_own"
  on public.luminex_teacher_devices
  for select
  to authenticated
  using (auth.uid() = teacher_id);

create policy if not exists "luminex_devices_insert_own"
  on public.luminex_teacher_devices
  for insert
  to authenticated
  with check (auth.uid() = teacher_id);

create policy if not exists "luminex_devices_update_own"
  on public.luminex_teacher_devices
  for update
  to authenticated
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Logs and nonces: service role writes; no public policies (admin-only via service key)
-- Optionally allow teachers to read their own activation/security logs
-- (uncomment if needed)
-- create policy if not exists "luminex_activation_logs_select_own" on public.luminex_activation_logs for select to authenticated using (auth.uid() = teacher_id);
-- create policy if not exists "luminex_security_logs_select_own" on public.luminex_security_logs for select to authenticated using (auth.uid() = teacher_id);
