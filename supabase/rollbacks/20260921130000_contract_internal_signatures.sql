BEGIN;

-- Stop writes and export contract_version_signatures before running this rollback.
LOCK TABLE public.contract_version_signatures IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.services_contract_versions IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.housing_collaborations IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.contract_version_signatures) THEN
    RAISE EXCEPTION 'Rollback refused: export and resolve contract_version_signatures before dropping signature data';
  END IF;
  IF EXISTS (SELECT 1 FROM public.services_contract_versions WHERE status IN ('signing','signed')) THEN
    RAISE EXCEPTION 'Rollback refused: signing/signed contract versions exist';
  END IF;
  IF EXISTS (SELECT 1 FROM public.housing_collaborations WHERE status = 'scheduled') THEN
    RAISE EXCEPTION 'Rollback refused: scheduled collaborations exist';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.activate_due_signed_collaborations();
DROP FUNCTION IF EXISTS public.sign_collaboration_contract_version(uuid, uuid, uuid, integer);
DROP TABLE IF EXISTS public.contract_version_signatures;

ALTER TABLE public.services_contract_versions
  DROP CONSTRAINT IF EXISTS services_contract_versions_agreement_shape,
  DROP CONSTRAINT IF EXISTS services_contract_versions_status_check,
  ADD CONSTRAINT services_contract_versions_status_check CHECK (status IN ('draft','proposed','ready_to_sign','superseded')),
  ADD CONSTRAINT services_contract_versions_agreement_shape CHECK (
    (status = 'draft' AND proposed_by IS NULL AND proposed_at IS NULL AND proposed_owner_id IS NULL AND proposed_concierge_id IS NULL
      AND owner_accepted_by IS NULL AND owner_accepted_at IS NULL AND concierge_accepted_by IS NULL AND concierge_accepted_at IS NULL
      AND change_requested_by IS NULL AND change_requested_at IS NULL AND change_request_reason IS NULL)
    OR (status <> 'draft' AND proposed_by IS NOT NULL AND proposed_at IS NOT NULL
      AND proposed_owner_id IS NOT NULL AND proposed_concierge_id IS NOT NULL AND proposed_owner_id <> proposed_concierge_id
      AND proposed_by IN (proposed_owner_id, proposed_concierge_id)
      AND ((owner_accepted_by IS NULL AND owner_accepted_at IS NULL) OR (owner_accepted_by IS NOT NULL AND owner_accepted_by = proposed_owner_id AND owner_accepted_at IS NOT NULL))
      AND ((concierge_accepted_by IS NULL AND concierge_accepted_at IS NULL) OR (concierge_accepted_by IS NOT NULL AND concierge_accepted_by = proposed_concierge_id AND concierge_accepted_at IS NOT NULL))
      AND (status <> 'ready_to_sign' OR (owner_accepted_at IS NOT NULL AND concierge_accepted_at IS NOT NULL))
      AND (status <> 'proposed' OR owner_accepted_at IS NULL OR concierge_accepted_at IS NULL)
      AND ((status = 'superseded' AND change_requested_by IS NOT NULL AND change_requested_by IN (proposed_owner_id, proposed_concierge_id)
        AND change_requested_by <> proposed_by AND change_requested_at IS NOT NULL AND change_request_reason IS NOT NULL AND length(btrim(change_request_reason)) BETWEEN 1 AND 2000)
        OR (status <> 'superseded' AND change_requested_by IS NULL AND change_requested_at IS NULL AND change_request_reason IS NULL)))
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
    IF old.status <> 'proposed' OR new.status NOT IN ('proposed','ready_to_sign','superseded') THEN
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

ALTER TABLE public.housing_collaborations
  DROP CONSTRAINT IF EXISTS housing_collaborations_status_check,
  ADD CONSTRAINT housing_collaborations_status_check
    CHECK (status IN ('pending_handover', 'active', 'paused', 'ended', 'cancelled'));

COMMIT;
