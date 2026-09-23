alter table public.profiles
  add column if not exists service_mode text null;

alter table public.profiles
  drop constraint if exists profiles_service_mode_check;

alter table public.profiles
  add constraint profiles_service_mode_check
  check (
    service_mode is null
    or service_mode in ('a_la_carte', 'full_management', 'both')
  );
