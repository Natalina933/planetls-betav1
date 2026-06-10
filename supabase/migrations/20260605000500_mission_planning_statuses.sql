-- Structured mission planning statuses
-- Date: 2026-06-05

BEGIN;

DO $$
DECLARE
  status_type regtype;
  next_value text;
BEGIN
  SELECT attribute.atttypid::regtype
    INTO status_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.missions'::regclass
    AND attribute.attname = 'status'
    AND attribute.attnum > 0
    AND NOT attribute.attisdropped;

  IF status_type IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_type WHERE oid = status_type::oid AND typtype = 'e')
  THEN
    FOREACH next_value IN ARRAY ARRAY[
      'to_schedule',
      'date_requested',
      'date_proposed',
      'date_confirmed',
      'scheduled'
    ]
    LOOP
      EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', status_type, next_value);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_status_check;

ALTER TABLE public.missions
  ADD CONSTRAINT missions_status_check
  CHECK (
    status::text IN (
      'draft',
      'assigned',
      'to_schedule',
      'date_requested',
      'date_proposed',
      'date_confirmed',
      'scheduled',
      'accepted',
      'in_progress',
      'completed',
      'canceled'
    )
  );

COMMIT;
