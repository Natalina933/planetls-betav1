alter table public.profiles
  drop constraint if exists profiles_longitude_valid,
  drop constraint if exists profiles_latitude_valid,
  drop column if exists geocoded_at,
  drop column if exists longitude,
  drop column if exists latitude;
