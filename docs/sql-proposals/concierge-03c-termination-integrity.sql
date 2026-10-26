-- PROPOSITION LOCALE UNIQUEMENT — NON EXÉCUTÉE.
-- Prévisualiser les JSON de résiliation existants et leurs participants/dates.
-- Tester sur base fraîche ET existante représentative, avec RLS et concurrence.
-- Sauvegarde préalable requise avant une application future autorisée.
-- Les demandes historiques 03B sans échéance sont reprises par POST, sans
-- réinitialiser leur date/demandeur ; aucune conversion globale de données ici.
BEGIN;

-- The application projects ended from an immutable effective instant. No cron,
-- table or operational status is added. Direct authenticated JSON writes must
-- not be able to forge, shorten, remove or extend a notice.
CREATE FUNCTION public.concierge_03c_freeze_termination()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.scope->'termination_request'->>'schema_version' = '1' THEN
    IF NEW.status IN ('ended', 'cancelled') AND OLD.status NOT IN ('ended', 'cancelled')
      AND (OLD.scope->'termination_request'->>'effective_at')::timestamptz > clock_timestamp() THEN
      RAISE EXCEPTION 'Early unilateral termination is not permitted' USING ERRCODE = '23514';
    END IF;
    IF NEW.scope->'termination_request' IS DISTINCT FROM OLD.scope->'termination_request'
      OR NEW.ends_on IS DISTINCT FROM OLD.ends_on
      OR NEW.scope->'termination_events' IS DISTINCT FROM OLD.scope->'termination_events'
      OR NEW.scope->'termination_history' IS DISTINCT FROM OLD.scope->'termination_history' THEN
      RAISE EXCEPTION 'Termination notice is immutable' USING ERRCODE = '23514';
    END IF;
  ELSIF (TG_OP = 'INSERT' AND NEW.scope->'termination_request' IS NOT NULL)
    OR (TG_OP = 'UPDATE' AND NEW.scope->'termination_request' IS DISTINCT FROM OLD.scope->'termination_request') THEN
    -- Same actual-executor trust boundary as the profile authorization guard.
    -- A caller-controlled JWT role GUC must never confer server privileges.
    IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Termination must use the authorized server workflow' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.concierge_03c_freeze_termination() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER concierge_03c_freeze_termination_guard
  BEFORE INSERT OR UPDATE ON public.housing_collaborations FOR EACH ROW
  EXECUTE FUNCTION public.concierge_03c_freeze_termination();

-- Intended serialization with concurrent notice writes; clock_timestamp is evaluated
-- AFTER the collaboration lock, not at the beginning of a waiting statement.
CREATE FUNCTION public.concierge_03c_guard_effective_termination()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $$
DECLARE
  collaboration_key text;
  linked_stay uuid;
  stay_collaboration_key text;
  agreement public.housing_collaborations%ROWTYPE;
  termination jsonb;
  effective_at timestamptz;
BEGIN
  collaboration_key := NEW.metadata->>'collaboration_id';
  IF TG_TABLE_NAME = 'missions' THEN
    linked_stay := NEW.reservation_id;
    IF linked_stay IS NOT NULL THEN
      SELECT metadata->>'collaboration_id' INTO stay_collaboration_key
        FROM public.reservations WHERE id = linked_stay;
      IF collaboration_key IS NOT NULL AND stay_collaboration_key IS NOT NULL
        AND collaboration_key IS DISTINCT FROM stay_collaboration_key THEN
        RAISE EXCEPTION 'Conflicting mission and stay collaborations' USING ERRCODE = '23514';
      END IF;
      collaboration_key := coalesce(collaboration_key, stay_collaboration_key);
    END IF;
  END IF;
  IF collaboration_key IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO agreement FROM public.housing_collaborations
    WHERE id = collaboration_key::uuid FOR NO KEY UPDATE;
  IF NOT FOUND OR agreement.status <> 'active' THEN
    RAISE EXCEPTION 'Collaboration is not active' USING ERRCODE = '23514';
  END IF;
  termination := agreement.scope->'termination_request';
  IF termination->>'schema_version' = '1' THEN
    BEGIN
      effective_at := (termination->>'effective_at')::timestamptz;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid termination date' USING ERRCODE = '23514';
    END;
    IF effective_at IS NULL OR effective_at <= clock_timestamp() THEN
      RAISE EXCEPTION 'Collaboration termination is effective' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.concierge_03c_guard_effective_termination() FROM PUBLIC, anon, authenticated;
-- Functions remain owned by the future DDL administrator, SECURITY INVOKER.
-- Same locking privileges/RLS prerequisite as 03B; no policy is broadened.
-- Both mission guards lock the same collaboration, in trigger-name order (03B,
-- then 03C); re-locking within a transaction is not a second independent mutex.
-- Multi-row transactions can still deadlock across collaborations: test for real.
-- INSERT guards do not protect later reattachment through UPDATE; audit/test those
-- paths before deployment. No concurrency guarantee is claimed by this proposal.
CREATE TRIGGER concierge_03c_mission_termination_guard
  BEFORE INSERT ON public.missions FOR EACH ROW
  EXECUTE FUNCTION public.concierge_03c_guard_effective_termination();
CREATE TRIGGER concierge_03c_reservation_termination_guard
  BEFORE INSERT ON public.reservations FOR EACH ROW
  EXECUTE FUNCTION public.concierge_03c_guard_effective_termination();

-- No RLS policy/grant is widened. This supplements existing authorization;
-- validate service-role request creation, owner/concierge reads, forbidden
-- tenant access, direct notice tampering and simultaneous notice/insert cases.
-- Existing missions, invoices, attachments and historical dates are untouched.
COMMIT;

-- Proposed rollback (review separately; do not execute with this proposal):
-- DROP TRIGGER concierge_03c_mission_termination_guard ON public.missions;
-- DROP TRIGGER concierge_03c_reservation_termination_guard ON public.reservations;
-- DROP FUNCTION public.concierge_03c_guard_effective_termination();
-- DROP TRIGGER concierge_03c_freeze_termination_guard ON public.housing_collaborations;
-- DROP FUNCTION public.concierge_03c_freeze_termination();
