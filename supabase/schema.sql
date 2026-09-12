-- ============================================================
-- EVENT REGISTRATION & CHECK-IN
-- PRODUCTION SCHEMA
-- ============================================================
--
-- PERINGATAN:
-- Script ini melakukan DROP pada tabel participants
-- dan event_settings.
--
-- Gunakan hanya jika database masih tahap setup/testing
-- atau data lama memang boleh dihapus.
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- RESET TABLES
-- ============================================================

drop table if exists public.participants cascade;
drop table if exists public.event_settings cascade;


-- ============================================================
-- EVENT SETTINGS
-- ============================================================

create table public.event_settings (
  id integer primary key default 1
    check (id = 1),

  event_name text not null
    default 'Event Check-in',

  event_subtitle text
    default 'Event Registration & Check-in',

  shirt_sizes text[] not null
    default array[
      'S',
      'M',
      'L',
      'XL',
      '2XL',
      '3XL',
      '4XL'
    ]::text[],

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);


insert into public.event_settings (
  id,
  event_name,
  event_subtitle,
  shirt_sizes
)
values (
  1,
  'Event Check-in',
  'Event Registration & Check-in',
  array[
    'S',
    'M',
    'L',
    'XL',
    '2XL',
    '3XL',
    '4XL'
  ]::text[]
);


-- ============================================================
-- PARTICIPANTS
-- ============================================================

create table public.participants (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  whatsapp text not null,

  shirt_size text not null,

  checked_in_at timestamptz null,

  checked_in_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint participants_name_length
    check (
      char_length(trim(name)) >= 2
    ),

  constraint participants_shirt_size
    check (
      shirt_size in (
        'S',
        'M',
        'L',
        'XL',
        '2XL',
        '3XL',
        '4XL'
      )
    ),

  constraint participants_whatsapp_length
    check (
      regexp_replace(
        whatsapp,
        '[^0-9]',
        '',
        'g'
      ) ~ '^[0-9]{8,20}$'
    )
);


-- ============================================================
-- INDEXES
-- ============================================================

create index participants_created_at_idx
  on public.participants(created_at desc);

create index participants_checked_in_at_idx
  on public.participants(checked_in_at);

create index participants_shirt_size_idx
  on public.participants(shirt_size);

create index participants_name_idx
  on public.participants(name);


-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger participants_updated_at
before update on public.participants
for each row
execute function public.set_updated_at();


create trigger event_settings_updated_at
before update on public.event_settings
for each row
execute function public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.participants
enable row level security;

alter table public.event_settings
enable row level security;


-- ============================================================
-- PARTICIPANTS POLICIES
-- ============================================================

create policy "Authenticated users can view participants"
on public.participants
for select
to authenticated
using (true);


create policy "Authenticated users can insert participants"
on public.participants
for insert
to authenticated
with check (true);


create policy "Authenticated users can update participants"
on public.participants
for update
to authenticated
using (true)
with check (true);


-- Tidak membuat DELETE policy.
-- Peserta tidak dapat dihapus dari aplikasi.


-- ============================================================
-- EVENT SETTINGS POLICIES
-- ============================================================

create policy "Authenticated users can view event settings"
on public.event_settings
for select
to authenticated
using (true);


create policy "Authenticated users can update event settings"
on public.event_settings
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- PUBLIC E-TICKET FUNCTION
-- ============================================================
--
-- Public hanya dapat melihat:
-- id
-- name
-- shirt_size
-- created_at
-- checked_in_at
--
-- WhatsApp TIDAK dikembalikan.
-- ============================================================

create or replace function public.get_public_participant(
  p_id uuid
)
returns table (
  id uuid,
  name text,
  shirt_size text,
  created_at timestamptz,
  checked_in_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.name,
    p.shirt_size,
    p.created_at,
    p.checked_in_at
  from public.participants p
  where p.id = p_id
  limit 1;
$$;


-- Hapus akses function lama jika ada
revoke all
on function public.get_public_participant(uuid)
from public;


grant execute
on function public.get_public_participant(uuid)
to anon, authenticated;


-- ============================================================
-- ATOMIC CHECK-IN FUNCTION
-- ============================================================
--
-- Ini bagian penting.
--
-- SELECT + UPDATE biasa bisa mengalami race condition
-- jika dua device scan peserta yang sama hampir bersamaan.
--
-- Function ini mengunci row menggunakan FOR UPDATE.
-- Device pertama akan melakukan check-in.
-- Device kedua akan mengetahui bahwa peserta sudah hadir.
-- ============================================================

create or replace function public.check_in_participant(
  p_id uuid
)
returns table (
  success boolean,
  already_checked_in boolean,
  id uuid,
  name text,
  shirt_size text,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  participant_row public.participants%rowtype;
begin

  select *
  into participant_row
  from public.participants
  where public.participants.id = p_id
  for update;

  if not found then

    return query
    select
      false,
      false,
      null::uuid,
      null::text,
      null::text,
      null::timestamptz;

    return;
  end if;


  if participant_row.checked_in_at is not null then

    return query
    select
      false,
      true,
      participant_row.id,
      participant_row.name,
      participant_row.shirt_size,
      participant_row.checked_in_at;

    return;
  end if;


  update public.participants
  set
    checked_in_at = now(),
    checked_in_by = auth.uid(),
    updated_at = now()
  where public.participants.id = p_id
  returning *
  into participant_row;


  return query
  select
    true,
    false,
    participant_row.id,
    participant_row.name,
    participant_row.shirt_size,
    participant_row.checked_in_at;

end;
$$;


-- Hapus akses function lama
revoke all
on function public.check_in_participant(uuid)
from public;


-- Hanya user login yang dapat check-in
grant execute
on function public.check_in_participant(uuid)
to authenticated;


-- ============================================================
-- TABLE PRIVILEGES
-- ============================================================

revoke all
on public.participants
from anon;

revoke all
on public.event_settings
from anon;


grant select, insert, update
on public.participants
to authenticated;


grant select, update
on public.event_settings
to authenticated;


-- ============================================================
-- FINAL
-- ============================================================

-- Tidak ada akses langsung anonymous ke participants.
-- Anonymous hanya dapat menggunakan get_public_participant().
--
-- Check-in hanya melalui check_in_participant().