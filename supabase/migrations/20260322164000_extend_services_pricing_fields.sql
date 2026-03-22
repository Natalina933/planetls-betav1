alter table if exists public.services_pricing
  add column if not exists property_type text,
  add column if not exists surface_min numeric,
  add column if not exists surface_max numeric,
  add column if not exists estimated_duration numeric;
