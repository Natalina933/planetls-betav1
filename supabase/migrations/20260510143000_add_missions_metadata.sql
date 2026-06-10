BEGIN;

ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.missions.metadata IS
  'Structured mission context such as source request, traveler stay details, field proofs and workflow flags.';

COMMIT;
