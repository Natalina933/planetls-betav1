-- Add missing owner_profile_id on missions
-- Date: 2026-02-23

BEGIN;

ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS owner_profile_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'owner_profile_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_owner_profile_id_fkey'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_owner_profile_id_fkey
      FOREIGN KEY (owner_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_missions_owner_profile_id
  ON public.missions(owner_profile_id);

COMMIT;

