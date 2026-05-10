BEGIN;

ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.missions.description IS
  'Owner or concierge readable mission instructions and notes.';

COMMIT;
