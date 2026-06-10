-- Structured mission planning statuses
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_status_check;

ALTER TABLE public.missions
  ADD CONSTRAINT missions_status_check
  CHECK (
    status IN (
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
