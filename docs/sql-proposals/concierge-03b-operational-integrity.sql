-- PROPOSITION LOCALE UNIQUEMENT — NON EXÉCUTÉE.
-- À valider sur base fraîche ET existante représentative avec RLS et concurrence.
-- Prévisualiser les doublons avant exécution : aucune suppression/fusion automatique.
-- Sauvegarde requise avant application future. En cas d'erreur : ROLLBACK.
-- Rollback après validation : retirer uniquement ces quatre index et ce trigger/
-- cette fonction dans une migration inverse revue. Aucune donnée n'est effacée.
BEGIN;

CREATE UNIQUE INDEX concierge_03b_quote_operation_unique
  ON public.missions ((metadata->>'quote_operation_key'))
  WHERE metadata->>'quote_operation_key' IS NOT NULL;
CREATE UNIQUE INDEX concierge_03b_stay_assignment_unique
  ON public.missions ((metadata->>'stay_assignment_key'))
  WHERE metadata->>'stay_assignment_key' IS NOT NULL;
CREATE UNIQUE INDEX concierge_03b_acceptance_invoice_unique
  ON public.invoices (quote_id)
  WHERE quote_id IS NOT NULL AND metadata->>'source' = 'quote_acceptance';
CREATE UNIQUE INDEX concierge_03b_invoice_source_line_unique
  ON public.invoice_items (invoice_id, (metadata->>'source_quote_item_id'))
  WHERE metadata->>'source_quote_item_id' IS NOT NULL;

-- The collaboration lock is intended to serialize operational creation against
-- status updates to ended/cancelled; PostgreSQL verification is still required.
-- Historical missions are not updated or deleted by this guard.
CREATE FUNCTION public.concierge_03b_guard_collaboration_intervention()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $$
DECLARE
  agreement public.housing_collaborations%ROWTYPE;
  collaboration_key text;
BEGIN
  collaboration_key := NEW.metadata->>'collaboration_id';
  IF collaboration_key IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO agreement FROM public.housing_collaborations
    WHERE id = collaboration_key::uuid FOR NO KEY UPDATE;
  IF NOT FOUND OR agreement.status <> 'active'
    OR agreement.owner_profile_id IS DISTINCT FROM NEW.owner_profile_id
    OR agreement.concierge_profile_id IS DISTINCT FROM NEW.concierge_profile_id
    OR agreement.housing_id::text IS DISTINCT FROM NEW.metadata->>'property_housing_id'
  THEN
    RAISE EXCEPTION 'Inactive or inconsistent collaboration' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.concierge_03b_guard_collaboration_intervention() FROM PUBLIC, anon, authenticated;
-- Owner is the future DDL administrator; SECURITY INVOKER never borrows its rights.
-- Trigger execution does not require caller EXECUTE. Trigger creation needs it.
-- NO KEY UPDATE conflicts with status/notice updates without taking a key-changing
-- lock against FK KEY SHARE. Actual lock scheduling/deadlocks remain untested.
-- Concierge SELECT alone is insufficient for a locking SELECT under current RLS.
-- Keep this fail-closed: no UPDATE grant/policy or SECURITY DEFINER workaround.
-- Resolve/test the authorized server execution path before promoting this proposal.
CREATE TRIGGER concierge_03b_collaboration_intervention_guard
  BEFORE INSERT ON public.missions FOR EACH ROW
  EXECUTE FUNCTION public.concierge_03b_guard_collaboration_intervention();

-- No RLS grants/policies are broadened. This guard supplements, never replaces,
-- existing participant/server authorization. Test authenticated owner/concierge,
-- unrelated tenants, service-role paths and simultaneous end/create explicitly.
COMMIT;
