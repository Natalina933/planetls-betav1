BEGIN;

ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_missions_reservation_id
  ON public.missions(reservation_id);

UPDATE public.missions AS m
SET reservation_id = r.id
FROM public.reservations AS r
WHERE m.reservation_id IS NULL
  AND (
    (m.metadata ->> 'reservation_id') = r.id::text
    OR (m.metadata ->> 'reservation_workflow_id') = r.id::text
  );

COMMENT ON COLUMN public.missions.reservation_id IS
  'Explicit link to the canonical shared reservation/stay object.';

COMMIT;
