BEGIN;

ALTER TABLE IF EXISTS public.missions
  ADD COLUMN IF NOT EXISTS service_id integer,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS scheduled_start timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_end timestamptz,
  ADD COLUMN IF NOT EXISTS response_time_minutes integer,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.missions
SET priority = 'normal'
WHERE priority IS NULL;

UPDATE public.missions
SET currency = 'EUR'
WHERE currency IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'missions_priority_check'
      AND conrelid = 'public.missions'::regclass
  ) THEN
    ALTER TABLE public.missions
      ADD CONSTRAINT missions_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END
$$;

COMMENT ON COLUMN public.missions.priority IS
  'Operational mission priority: low, normal, high or urgent.';

COMMIT;
