-- Resolve remaining Security Advisor findings with minimal safe policies
-- Date: 2026-04-04

BEGIN;

-- ---------------------------------------------------------------------------
-- Certification history
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.certification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certification_history_select_own ON public.certification_history;
DROP POLICY IF EXISTS certification_history_insert_none ON public.certification_history;
DROP POLICY IF EXISTS certification_history_update_none ON public.certification_history;
DROP POLICY IF EXISTS certification_history_delete_none ON public.certification_history;

CREATE POLICY certification_history_select_own
  ON public.certification_history
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR validated_by = auth.uid());

CREATE POLICY certification_history_insert_none
  ON public.certification_history
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY certification_history_update_none
  ON public.certification_history
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY certification_history_delete_none
  ON public.certification_history
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- Housing
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.housing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS housing_select_participants ON public.housing;
DROP POLICY IF EXISTS housing_insert_participants ON public.housing;
DROP POLICY IF EXISTS housing_update_participants ON public.housing;
DROP POLICY IF EXISTS housing_delete_participants ON public.housing;

CREATE POLICY housing_select_participants
  ON public.housing
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = COALESCE(
      proprietaire ->> 'manager_profile_id',
      proprietaire ->> 'concierge_profile_id',
      ''
    )
    OR auth.uid()::text = COALESCE(
      proprietaire ->> 'owner_profile_id',
      proprietaire ->> 'id',
      proprietaire ->> 'profile_id',
      ''
    )
  );

CREATE POLICY housing_insert_participants
  ON public.housing
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = COALESCE(
      proprietaire ->> 'manager_profile_id',
      proprietaire ->> 'concierge_profile_id',
      ''
    )
    OR auth.uid()::text = COALESCE(
      proprietaire ->> 'owner_profile_id',
      proprietaire ->> 'id',
      proprietaire ->> 'profile_id',
      ''
    )
  );

CREATE POLICY housing_update_participants
  ON public.housing
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = COALESCE(
      proprietaire ->> 'manager_profile_id',
      proprietaire ->> 'concierge_profile_id',
      ''
    )
    OR auth.uid()::text = COALESCE(
      proprietaire ->> 'owner_profile_id',
      proprietaire ->> 'id',
      proprietaire ->> 'profile_id',
      ''
    )
  )
  WITH CHECK (
    auth.uid()::text = COALESCE(
      proprietaire ->> 'manager_profile_id',
      proprietaire ->> 'concierge_profile_id',
      ''
    )
    OR auth.uid()::text = COALESCE(
      proprietaire ->> 'owner_profile_id',
      proprietaire ->> 'id',
      proprietaire ->> 'profile_id',
      ''
    )
  );

CREATE POLICY housing_delete_participants
  ON public.housing
  FOR DELETE
  TO authenticated
  USING (
    auth.uid()::text = COALESCE(
      proprietaire ->> 'manager_profile_id',
      proprietaire ->> 'concierge_profile_id',
      ''
    )
    OR auth.uid()::text = COALESCE(
      proprietaire ->> 'owner_profile_id',
      proprietaire ->> 'id',
      proprietaire ->> 'profile_id',
      ''
    )
  );

-- ---------------------------------------------------------------------------
-- Reference catalogs
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_types_select_authenticated ON public.service_types;
DROP POLICY IF EXISTS services_catalog_select_authenticated ON public.services_catalog;

CREATE POLICY service_types_select_authenticated
  ON public.service_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY services_catalog_select_authenticated
  ON public.services_catalog
  FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Services contracts
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.services_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_contracts_select_own ON public.services_contracts;
DROP POLICY IF EXISTS services_contracts_insert_own ON public.services_contracts;
DROP POLICY IF EXISTS services_contracts_update_own ON public.services_contracts;
DROP POLICY IF EXISTS services_contracts_delete_own ON public.services_contracts;

CREATE POLICY services_contracts_select_own
  ON public.services_contracts
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY services_contracts_insert_own
  ON public.services_contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY services_contracts_update_own
  ON public.services_contracts
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY services_contracts_delete_own
  ON public.services_contracts
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Internal rate limiting table
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'rate_limit_attempts'
  ) THEN
    EXECUTE 'ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS rate_limit_attempts_no_client_access ON public.rate_limit_attempts';
    EXECUTE $policy$
      CREATE POLICY rate_limit_attempts_no_client_access
        ON public.rate_limit_attempts
        FOR ALL
        TO authenticated
        USING (false)
        WITH CHECK (false)
    $policy$;
  END IF;
END
$$;

COMMIT;
