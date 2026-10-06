alter table public.profiles
  add column if not exists latitude double precision null,
  add column if not exists longitude double precision null,
  add column if not exists geocoded_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_latitude_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_latitude_valid
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_longitude_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_longitude_valid
      check (longitude is null or longitude between -180 and 180);
  end if;
end $$;
