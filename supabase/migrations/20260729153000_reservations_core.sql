BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.services_contracts(id) ON DELETE SET NULL,
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  external_reference TEXT,
  channel TEXT,
  traveler_first_name TEXT,
  traveler_last_name TEXT,
  traveler_phone TEXT,
  traveler_email TEXT,
  guest_count INTEGER CHECK (guest_count IS NULL OR guest_count >= 0),
  adults_count INTEGER CHECK (adults_count IS NULL OR adults_count >= 0),
  children_count INTEGER CHECK (children_count IS NULL OR children_count >= 0),
  infants_count INTEGER CHECK (infants_count IS NULL OR infants_count >= 0),
  pets_count INTEGER CHECK (pets_count IS NULL OR pets_count >= 0),
  check_in_at TIMESTAMPTZ NOT NULL,
  check_out_at TIMESTAMPTZ NOT NULL,
  arrival_time_window TEXT,
  departure_time_window TEXT,
  access_instructions TEXT,
  owner_notes TEXT,
  concierge_notes TEXT,
  status TEXT NOT NULL DEFAULT 'shared'
    CHECK (status IN ('draft', 'shared', 'acknowledged', 'scheduled', 'in_stay', 'completed', 'canceled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reservations_chronology_check CHECK (check_out_at > check_in_at)
);

CREATE INDEX IF NOT EXISTS idx_reservations_contract_id
  ON public.reservations(contract_id);

CREATE INDEX IF NOT EXISTS idx_reservations_owner_profile_id
  ON public.reservations(owner_profile_id);

CREATE INDEX IF NOT EXISTS idx_reservations_concierge_profile_id
  ON public.reservations(concierge_profile_id);

CREATE INDEX IF NOT EXISTS idx_reservations_property_id
  ON public.reservations(property_id);

CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON public.reservations(status);

CREATE INDEX IF NOT EXISTS idx_reservations_check_in_at
  ON public.reservations(check_in_at);

CREATE INDEX IF NOT EXISTS idx_reservations_check_out_at
  ON public.reservations(check_out_at);

CREATE INDEX IF NOT EXISTS idx_reservations_owner_concierge_period
  ON public.reservations(owner_profile_id, concierge_profile_id, check_in_at, check_out_at);

CREATE OR REPLACE FUNCTION public.set_reservations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_reservations_updated_at ON public.reservations;
CREATE TRIGGER trg_set_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.set_reservations_updated_at();

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservations_select_participants ON public.reservations;
DROP POLICY IF EXISTS reservations_insert_owner_or_concierge ON public.reservations;
DROP POLICY IF EXISTS reservations_update_participants ON public.reservations;
DROP POLICY IF EXISTS reservations_delete_creator ON public.reservations;

CREATE POLICY reservations_select_participants
  ON public.reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

CREATE POLICY reservations_insert_owner_or_concierge
  ON public.reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (owner_profile_id, concierge_profile_id)
    AND (
      contract_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.services_contracts sc
        WHERE sc.id = reservations.contract_id
          AND sc.profile_id IN (reservations.owner_profile_id, reservations.concierge_profile_id)
      )
    )
    AND EXISTS (
      SELECT 1
      FROM public.concierge_owner_matches com
      WHERE com.concierge_profile_id = reservations.concierge_profile_id
        AND com.owner_profile_id = reservations.owner_profile_id
        AND com.match_status IN ('new', 'contacted')
    )
    AND (created_by_profile_id IS NULL OR created_by_profile_id = auth.uid())
  );

CREATE POLICY reservations_update_participants
  ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id)
  WITH CHECK (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

CREATE POLICY reservations_delete_creator
  ON public.reservations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by_profile_id);

COMMENT ON TABLE public.reservations IS
  'Canonical shared stay/reservation object between owner and concierge.';

COMMENT ON COLUMN public.reservations.contract_id IS
  'Optional link to a signed service contract governing the collaboration.';

COMMENT ON COLUMN public.reservations.metadata IS
  'Structured stay payload, import traces and temporary migration compatibility fields.';

COMMIT;
