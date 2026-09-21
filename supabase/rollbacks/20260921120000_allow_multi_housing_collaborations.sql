BEGIN;

DROP INDEX IF EXISTS public.housing_collaborations_housing_status_idx;

CREATE UNIQUE INDEX IF NOT EXISTS housing_collaborations_one_active_per_housing
  ON public.housing_collaborations (housing_id)
  WHERE status IN ('pending_handover', 'active', 'paused');

COMMIT;
