-- RocketHacks Organizer Portal
-- Migration 029: phone on organizer_profiles (staff roster contact)
-- Run after 020+.

alter table public.organizer_profiles
  add column if not exists phone text;

comment on column public.organizer_profiles.phone is
  'Staff contact phone for roster export; optional.';
