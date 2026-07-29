BEGIN;

ALTER TABLE public.provider_interventions
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_provider_interventions_reservation_id
  ON public.provider_interventions(reservation_id);

UPDATE public.provider_interventions AS pi
SET reservation_id = m.reservation_id
FROM public.missions AS m
WHERE pi.reservation_id IS NULL
  AND (pi.metadata ->> 'mission_id') = m.id::text
  AND m.reservation_id IS NOT NULL;

COMMENT ON COLUMN public.provider_interventions.reservation_id IS
  'Explicit link to the canonical shared reservation/stay object when the intervention is attached to a stay workflow.';

COMMIT;
