BEGIN;

ALTER TABLE public.workflow_events
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_events_reservation_created_at
  ON public.workflow_events(reservation_id, created_at DESC);

UPDATE public.workflow_events AS we
SET reservation_id = m.reservation_id
FROM public.missions AS m
WHERE we.reservation_id IS NULL
  AND we.mission_id = m.id
  AND m.reservation_id IS NOT NULL;

COMMENT ON COLUMN public.workflow_events.reservation_id IS
  'Explicit link to the canonical reservation/stay object when the workflow event concerns a shared stay.';

COMMIT;
