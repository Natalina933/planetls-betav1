alter table public.profiles
  add column if not exists image text;

comment on column public.profiles.image is
  'Image de couverture publique utilisee pour les cards de conciergerie.';
