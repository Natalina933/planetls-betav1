-- Add missing concierge_profile_id on missions
-- Date: 2026-02-23

BEGIN;

ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS concierge_profile_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'concierge_profile_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_concierge_profile_id_fkey'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_concierge_profile_id_fkey
      FOREIGN KEY (concierge_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_missions_concierge_profile_id
  ON public.missions(concierge_profile_id);

COMMIT;

