BEGIN;

ALTER TABLE public.housing_collaborations
  DROP CONSTRAINT IF EXISTS housing_collaborations_status_check,
  ADD CONSTRAINT housing_collaborations_status_check
    CHECK (status IN ('pending_handover', 'scheduled', 'active', 'paused', 'ended', 'cancelled'));

ALTER TABLE public.services_contract_versions
  DROP CONSTRAINT services_contract_versions_agreement_shape,
  DROP CONSTRAINT services_contract_versions_status_check,
  ADD CONSTRAINT services_contract_versions_status_check
    CHECK (status IN ('draft','proposed','ready_to_sign','signing','signed','superseded')),
  ADD CONSTRAINT services_contract_versions_agreement_shape CHECK (
    (status = 'draft' AND proposed_by IS NULL AND proposed_at IS NULL AND proposed_owner_id IS NULL AND proposed_concierge_id IS NULL
      AND owner_accepted_by IS NULL AND owner_accepted_at IS NULL AND concierge_accepted_by IS NULL AND concierge_accepted_at IS NULL
      AND change_requested_by IS NULL AND change_requested_at IS NULL AND change_request_reason IS NULL)
    OR (status <> 'draft' AND proposed_by IS NOT NULL AND proposed_at IS NOT NULL
      AND proposed_owner_id IS NOT NULL AND proposed_concierge_id IS NOT NULL AND proposed_owner_id <> proposed_concierge_id
      AND proposed_by IN (proposed_owner_id, proposed_concierge_id)
      AND owner_accepted_by IS NOT NULL AND owner_accepted_by = proposed_owner_id AND owner_accepted_at IS NOT NULL
      AND concierge_accepted_by IS NOT NULL AND concierge_accepted_by = proposed_concierge_id AND concierge_accepted_at IS NOT NULL
      AND status IN ('ready_to_sign','signing','signed')
      AND change_requested_by IS NULL AND change_requested_at IS NULL AND change_request_reason IS NULL)
    OR (status = 'proposed' AND proposed_by IS NOT NULL AND proposed_at IS NOT NULL
      AND proposed_owner_id IS NOT NULL AND proposed_concierge_id IS NOT NULL AND proposed_owner_id <> proposed_concierge_id
      AND proposed_by IN (proposed_owner_id, proposed_concierge_id)
      AND ((owner_accepted_by IS NULL AND owner_accepted_at IS NULL) OR (owner_accepted_by IS NOT NULL AND owner_accepted_by = proposed_owner_id AND owner_accepted_at IS NOT NULL))
      AND ((concierge_accepted_by IS NULL AND concierge_accepted_at IS NULL) OR (concierge_accepted_by IS NOT NULL AND concierge_accepted_by = proposed_concierge_id AND concierge_accepted_at IS NOT NULL))
      AND (owner_accepted_at IS NULL OR concierge_accepted_at IS NULL)
      AND change_requested_by IS NULL AND change_requested_at IS NULL AND change_request_reason IS NULL)
    OR (status = 'superseded' AND proposed_by IS NOT NULL AND proposed_at IS NOT NULL
      AND proposed_owner_id IS NOT NULL AND proposed_concierge_id IS NOT NULL AND proposed_owner_id <> proposed_concierge_id
      AND proposed_by IN (proposed_owner_id, proposed_concierge_id)
      AND change_requested_by IS NOT NULL AND change_requested_by IN (proposed_owner_id, proposed_concierge_id)
      AND change_requested_by <> proposed_by AND change_requested_at IS NOT NULL
      AND change_request_reason IS NOT NULL AND length(btrim(change_request_reason)) BETWEEN 1 AND 2000)
  );

CREATE TABLE public.contract_version_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_version_id uuid NOT NULL REFERENCES public.services_contract_versions(id) ON DELETE RESTRICT,
  signer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  signer_role text NOT NULL CHECK (signer_role IN ('owner', 'concierge')),
  signed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (contract_version_id, signer_role),
  UNIQUE (contract_version_id, signer_profile_id)
);

CREATE INDEX contract_version_signatures_version_idx
  ON public.contract_version_signatures(contract_version_id, signed_at);

ALTER TABLE public.contract_version_signatures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contract_version_signatures FROM anon, authenticated;
GRANT SELECT ON public.contract_version_signatures TO authenticated;
GRANT ALL ON public.contract_version_signatures TO service_role;

CREATE POLICY contract_version_signatures_participants_read
  ON public.contract_version_signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.services_contract_versions cv
      JOIN public.services_contracts sc ON sc.id = cv.contract_id
      JOIN public.housing_collaborations c ON c.id = sc.collaboration_id
      WHERE cv.id = contract_version_id
        AND auth.uid() IN (c.owner_profile_id, c.concierge_profile_id)
    )
  );

CREATE OR REPLACE FUNCTION public.guard_contract_version_freeze() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF tg_op = 'DELETE' THEN
    IF old.status <> 'draft' THEN RAISE EXCEPTION 'Frozen version cannot be deleted' USING errcode = '42501'; END IF;
    RETURN old;
  END IF;
  IF new.id <> old.id OR new.contract_id <> old.contract_id OR new.version_number <> old.version_number
    OR new.created_by <> old.created_by OR new.created_at <> old.created_at
    OR new.previous_version_id IS DISTINCT FROM old.previous_version_id THEN
    RAISE EXCEPTION 'Version identity is immutable' USING errcode = '42501';
  END IF;
  IF old.status <> 'draft' THEN
    IF (to_jsonb(new) - ARRAY['status','owner_accepted_by','owner_accepted_at','concierge_accepted_by','concierge_accepted_at','change_requested_by','change_requested_at','change_request_reason'])
      IS DISTINCT FROM (to_jsonb(old) - ARRAY['status','owner_accepted_by','owner_accepted_at','concierge_accepted_by','concierge_accepted_at','change_requested_by','change_requested_at','change_request_reason']) THEN
      RAISE EXCEPTION 'Frozen version content is immutable' USING errcode = '42501';
    END IF;
    IF old.status = 'proposed' AND new.status IN ('proposed','ready_to_sign','superseded') THEN
      NULL;
    ELSIF old.status = 'ready_to_sign' AND new.status IN ('ready_to_sign','signing','signed') THEN
      NULL;
    ELSIF old.status = 'signing' AND new.status IN ('signing','signed') THEN
      NULL;
    ELSIF old.status = 'signed' AND new.status = 'signed' THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Invalid frozen transition' USING errcode = '42501';
    END IF;
    IF (old.owner_accepted_at IS NOT NULL AND (new.owner_accepted_at IS DISTINCT FROM old.owner_accepted_at OR new.owner_accepted_by IS DISTINCT FROM old.owner_accepted_by))
      OR (old.concierge_accepted_at IS NOT NULL AND (new.concierge_accepted_at IS DISTINCT FROM old.concierge_accepted_at OR new.concierge_accepted_by IS DISTINCT FROM old.concierge_accepted_by)) THEN
      RAISE EXCEPTION 'Agreement cannot be overwritten' USING errcode = '42501';
    END IF;
  ELSIF new.status <> 'draft' THEN
    IF new.status <> 'proposed' OR new.conditions IS DISTINCT FROM old.conditions OR new.revision <> old.revision
      OR new.updated_at <> old.updated_at OR new.updated_by <> old.updated_by THEN
      RAISE EXCEPTION 'Propose the exact saved revision' USING errcode = '40001';
    END IF;
    IF new.owner_accepted_at IS NOT NULL OR new.concierge_accepted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Proposing does not mean accepting' USING errcode = '42501';
    END IF;
  END IF;
  RETURN new;
END $$;

CREATE OR REPLACE FUNCTION public.sign_collaboration_contract_version(
  p_collaboration_id uuid,
  p_actor_id uuid,
  p_version_id uuid,
  p_expected_revision integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  c public.housing_collaborations;
  v public.services_contract_versions;
  actor_role text;
  effective_start date;
  owner_signed boolean;
  concierge_signed boolean;
  next_version_status text;
  next_collaboration_status text;
  signatures jsonb;
BEGIN
  SELECT * INTO c FROM public.housing_collaborations WHERE id = p_collaboration_id FOR UPDATE;
  IF NOT FOUND OR p_actor_id IS NULL OR p_actor_id NOT IN (c.owner_profile_id, c.concierge_profile_id) THEN
    RAISE EXCEPTION 'Collaboration unavailable' USING errcode = '42501';
  END IF;
  IF c.status NOT IN ('pending_handover','scheduled','active') THEN
    RAISE EXCEPTION 'Collaboration cannot be signed' USING errcode = '40001';
  END IF;

  actor_role := CASE WHEN p_actor_id = c.owner_profile_id THEN 'owner' ELSE 'concierge' END;

  SELECT cv.* INTO v
  FROM public.services_contract_versions cv
  JOIN public.services_contracts sc ON sc.id = cv.contract_id
  WHERE cv.id = p_version_id AND sc.collaboration_id = c.id
  FOR UPDATE OF cv;
  IF NOT FOUND OR p_expected_revision IS NULL OR v.revision <> p_expected_revision THEN
    RAISE EXCEPTION 'Version or revision changed; reload' USING errcode = '40001';
  END IF;
  IF v.status NOT IN ('ready_to_sign','signing','signed') THEN
    RAISE EXCEPTION 'Version is not ready to sign' USING errcode = '40001';
  END IF;
  IF v.owner_accepted_at IS NULL OR v.concierge_accepted_at IS NULL THEN
    RAISE EXCEPTION 'Both agreements are required before signature' USING errcode = '23514';
  END IF;
  IF v.proposed_owner_id <> c.owner_profile_id OR v.proposed_concierge_id <> c.concierge_profile_id THEN
    RAISE EXCEPTION 'Participants changed' USING errcode = '40001';
  END IF;
  IF jsonb_typeof(v.conditions->'duration'->'startsOn') <> 'string'
    OR (v.conditions->'duration'->>'startsOn') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Invalid effective date' USING errcode = '23514';
  END IF;
  BEGIN
    effective_start := (v.conditions->'duration'->>'startsOn')::date;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid effective date' USING errcode = '23514';
  END;
  IF to_char(effective_start, 'YYYY-MM-DD') <> v.conditions->'duration'->>'startsOn' THEN
    RAISE EXCEPTION 'Invalid effective date' USING errcode = '23514';
  END IF;

  INSERT INTO public.contract_version_signatures(contract_version_id, signer_profile_id, signer_role)
  VALUES (v.id, p_actor_id, actor_role)
  ON CONFLICT (contract_version_id, signer_role) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.contract_version_signatures
    WHERE contract_version_id = v.id AND signer_role = actor_role AND signer_profile_id = p_actor_id
  ) THEN
    RAISE EXCEPTION 'Signature role already used by another participant' USING errcode = '42501';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.contract_version_signatures WHERE contract_version_id = v.id AND signer_role = 'owner'),
         EXISTS(SELECT 1 FROM public.contract_version_signatures WHERE contract_version_id = v.id AND signer_role = 'concierge')
    INTO owner_signed, concierge_signed;

  next_version_status := CASE WHEN owner_signed AND concierge_signed THEN 'signed' ELSE 'signing' END;
  IF v.status <> next_version_status THEN
    UPDATE public.services_contract_versions SET status = next_version_status WHERE id = v.id RETURNING * INTO v;
  END IF;

  IF next_version_status = 'signed' THEN
    next_collaboration_status := CASE WHEN effective_start <= CURRENT_DATE THEN 'active' ELSE 'scheduled' END;
    IF c.status <> next_collaboration_status THEN
      UPDATE public.housing_collaborations
      SET status = next_collaboration_status, updated_at = clock_timestamp()
      WHERE id = c.id
      RETURNING * INTO c;
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.signed_at), '[]'::jsonb)
    INTO signatures
  FROM public.contract_version_signatures s
  WHERE s.contract_version_id = v.id;

  RETURN jsonb_build_object(
    'version', to_jsonb(v),
    'collaboration', to_jsonb(c),
    'signatures', signatures,
    'effectiveStart', to_char(effective_start, 'YYYY-MM-DD')
  );
END $$;

REVOKE ALL ON FUNCTION public.sign_collaboration_contract_version(uuid, uuid, uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_collaboration_contract_version(uuid, uuid, uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.activate_due_signed_collaborations()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  WITH due AS (
    SELECT c.id
    FROM public.housing_collaborations c
    JOIN public.services_contracts sc ON sc.collaboration_id = c.id
    JOIN public.services_contract_versions cv ON cv.contract_id = sc.id
    WHERE c.status = 'scheduled'
      AND cv.status = 'signed'
      AND jsonb_typeof(cv.conditions->'duration'->'startsOn') = 'string'
      AND (cv.conditions->'duration'->>'startsOn') ~ '^\d{4}-\d{2}-\d{2}$'
      AND (cv.conditions->'duration'->>'startsOn')::date <= CURRENT_DATE
      AND EXISTS (SELECT 1 FROM public.contract_version_signatures s WHERE s.contract_version_id = cv.id AND s.signer_role = 'owner')
      AND EXISTS (SELECT 1 FROM public.contract_version_signatures s WHERE s.contract_version_id = cv.id AND s.signer_role = 'concierge')
    FOR UPDATE OF c
  ), updated AS (
    UPDATE public.housing_collaborations c
    SET status = 'active', updated_at = clock_timestamp()
    FROM due
    WHERE c.id = due.id
    RETURNING c.id
  )
  SELECT count(*) INTO updated_count FROM updated;
  RETURN updated_count;
END $$;

REVOKE ALL ON FUNCTION public.activate_due_signed_collaborations() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_due_signed_collaborations() TO service_role;

COMMENT ON TABLE public.contract_version_signatures IS 'Internal PlanetLS signature records for an exact contract version; not a qualified external e-signature.';
COMMENT ON FUNCTION public.sign_collaboration_contract_version(uuid, uuid, uuid, integer) IS 'Server-only internal signature workflow. Agreement timestamps are not signatures.';

COMMIT;
