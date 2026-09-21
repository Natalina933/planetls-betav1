BEGIN;

-- A housing can have several live collaborations with distinct concierges.
-- The accepted quote remains the idempotency key for creating/reusing a collaboration.
DROP INDEX IF EXISTS public.housing_collaborations_one_active_per_housing;

CREATE INDEX IF NOT EXISTS housing_collaborations_housing_status_idx
  ON public.housing_collaborations (housing_id, status);

COMMIT;
