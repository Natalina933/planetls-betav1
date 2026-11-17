-- SEC-AUTH-01B2B4C1A: préparation locale, non appliquée.
-- Prérequis: migrations missions/provider workspace, puis liaisons réservations
-- de juillet 2026. Exécuter uniquement sous un propriétaire SQL de confiance.
-- Aucun backfill: metadata.mission_id, rapports, événements et réservation
-- historiques ne constituent pas une provenance d'affectation.
BEGIN;
SET LOCAL lock_timeout = '3s';

-- Aucun ALTER OWNER implicite. L'ancrage est le propriétaire des objets
-- historiques de sécurité, pas un nom de rôle réputé sûr. Ce contrôle devra
-- être validé sur le catalogue réel avant toute autorisation d'application.
DO $preflight$
DECLARE
  v_owner OID;
BEGIN
  SELECT oid INTO v_owner FROM pg_catalog.pg_roles WHERE rolname = current_user
    AND (rolsuper OR rolbypassrls);
  IF v_owner IS NULL OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE oid IN (
    'public.missions'::regclass, 'public.provider_interventions'::regclass,
    'public.reservations'::regclass, 'public.profiles'::regclass) AND relowner <> v_owner)
    OR (SELECT proowner FROM pg_catalog.pg_proc
      WHERE oid = 'public.guard_profile_authorization_attributes()'::regprocedure) <> v_owner
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r
      WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
        AND (r.oid = v_owner OR r.rolsuper OR r.rolcreaterole
          OR (r.rolname IN ('anon', 'authenticated') AND (r.rolbypassrls
            OR pg_catalog.pg_has_role(r.oid, 'service_role'::regrole, 'MEMBER')))
          OR pg_catalog.pg_has_role(r.oid, v_owner, 'MEMBER')
          OR pg_catalog.has_schema_privilege(r.oid, 'public', 'CREATE'))) THEN
    RAISE EXCEPTION 'Untrusted assignment object ownership or role inheritance' USING ERRCODE = '42501';
  END IF;
END;
$preflight$;

-- La PK id rend cette unicité vraie sur les données existantes. Cette clé
-- supplémentaire permet une FK composite indépendante de RLS/service_role.
ALTER TABLE public.provider_interventions
  ADD CONSTRAINT provider_interventions_assignment_identity_key
  UNIQUE (id, provider_profile_id);

-- Clés natives: protection aussi sous les snapshots REPEATABLE READ, sans
-- dépendre seulement de la visibilité d'un EXISTS dans un trigger.
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_assignment_owner_key UNIQUE (id, owner_profile_id),
  ADD CONSTRAINT reservations_assignment_property_key UNIQUE (id, property_id);

CREATE TABLE public.mission_provider_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE RESTRICT,
  provider_intervention_id UUID NOT NULL UNIQUE,
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_by_principal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_by_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'revoked')),
  revoked_at TIMESTAMPTZ,
  revoked_by_principal_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revoked_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  revocation_reason TEXT,
  operation_id UUID NOT NULL UNIQUE,
  business_fingerprint TEXT NOT NULL CHECK (business_fingerprint ~ '^[0-9a-f]{64}$'),
  -- Instantané structurel immuable, y compris lorsque la valeur est NULL.
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE RESTRICT,
  reservation_property_id UUID,
  CONSTRAINT mission_provider_assignments_reservation_scope_check CHECK (
    (reservation_id IS NULL AND reservation_property_id IS NULL)
    OR (reservation_id IS NOT NULL AND owner_profile_id IS NOT NULL)
  ),
  CONSTRAINT mission_provider_assignments_reservation_owner_fkey
    FOREIGN KEY (reservation_id, owner_profile_id)
    REFERENCES public.reservations(id, owner_profile_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT mission_provider_assignments_reservation_property_fkey
    FOREIGN KEY (reservation_id, reservation_property_id)
    REFERENCES public.reservations(id, property_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT mission_provider_assignments_intervention_identity_fkey
    FOREIGN KEY (provider_intervention_id, provider_profile_id)
    REFERENCES public.provider_interventions(id, provider_profile_id) ON DELETE RESTRICT,
  CONSTRAINT mission_provider_assignments_revocation_check CHECK (
    (state = 'active' AND revoked_at IS NULL AND revoked_by_principal_id IS NULL
      AND revoked_by_profile_id IS NULL AND revocation_reason IS NULL)
    OR (state = 'revoked' AND revoked_at IS NOT NULL AND revoked_by_principal_id IS NOT NULL
      AND revoked_by_profile_id IS NOT NULL AND revocation_reason IS NOT NULL
      AND length(btrim(revocation_reason)) > 0 AND revoked_at >= assigned_at)
  )
);

CREATE INDEX mission_provider_assignments_mission_idx
  ON public.mission_provider_assignments(mission_id, state);
CREATE INDEX mission_provider_assignments_provider_idx
  ON public.mission_provider_assignments(provider_profile_id, state);
CREATE INDEX mission_provider_assignments_reservation_idx
  ON public.mission_provider_assignments(reservation_id) WHERE reservation_id IS NOT NULL;

COMMENT ON TABLE public.mission_provider_assignments IS
  'Provenance serveur uniquement. Jamais déduite des métadonnées; historique conservé après révocation.';

-- Helper privé partagé: réservation avant mission, puis intervention dans
-- l'appelant. Une liaison modifiée entre lecture et verrou produit 40001;
-- aucun verrou de nouvelle réservation acquis hors ordre et aucun transfert.
CREATE FUNCTION public.lock_mission_assignment_scope(p_mission_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_reservation_id UUID;
  v_mission public.missions%ROWTYPE;
  v_reservation public.reservations%ROWTYPE;
BEGIN
  SELECT reservation_id INTO v_reservation_id FROM public.missions WHERE id = p_mission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid assignment scope' USING ERRCODE = '23503';
  END IF;
  IF v_reservation_id IS NOT NULL THEN
    SELECT * INTO v_reservation FROM public.reservations WHERE id = v_reservation_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid assignment scope' USING ERRCODE = '23503';
    END IF;
  END IF;
  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id FOR UPDATE;
  IF NOT FOUND OR v_mission.reservation_id IS DISTINCT FROM v_reservation_id THEN
    RAISE EXCEPTION 'Assignment scope changed; retry transaction' USING ERRCODE = '40001';
  END IF;
  IF v_reservation_id IS NOT NULL AND (
    v_mission.owner_profile_id IS DISTINCT FROM v_reservation.owner_profile_id
    OR (v_mission.property_id IS NOT NULL
      AND v_mission.property_id IS DISTINCT FROM v_reservation.property_id)) THEN
    RAISE EXCEPTION 'Inconsistent reservation assignment scope' USING ERRCODE = '23514';
  END IF;
END;
$function$;

CREATE FUNCTION public.guard_mission_provider_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_mission public.missions%ROWTYPE;
  v_intervention public.provider_interventions%ROWTYPE;
  v_reservation_property_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Assignment history cannot be deleted' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF ROW(NEW.id, NEW.mission_id, NEW.provider_intervention_id, NEW.provider_profile_id,
      NEW.assigned_by_principal_id, NEW.assigned_by_profile_id, NEW.assigned_at,
      NEW.operation_id, NEW.business_fingerprint, NEW.owner_profile_id, NEW.reservation_id, NEW.reservation_property_id)
      IS DISTINCT FROM ROW(OLD.id, OLD.mission_id, OLD.provider_intervention_id, OLD.provider_profile_id,
      OLD.assigned_by_principal_id, OLD.assigned_by_profile_id, OLD.assigned_at,
      OLD.operation_id, OLD.business_fingerprint, OLD.owner_profile_id, OLD.reservation_id, OLD.reservation_property_id) THEN
      RAISE EXCEPTION 'Assignment identity is immutable' USING ERRCODE = '23514';
    END IF;
    IF OLD.state <> 'active' OR NEW.state <> 'revoked' THEN
      RAISE EXCEPTION 'Only terminal revocation is allowed' USING ERRCODE = '23514';
    END IF;
    NEW.revoked_at := greatest(clock_timestamp(), OLD.assigned_at);
    RETURN NEW;
  END IF;

  IF NEW.state IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'A new assignment must be active' USING ERRCODE = '23514';
  END IF;
  -- Même ordre que la RPC: réservation, mission, puis intervention. Pas de confiance dans
  -- le JSON ni de contournement conditionné par current_user/service_role.
  PERFORM public.lock_mission_assignment_scope(NEW.mission_id);
  SELECT * INTO v_mission FROM public.missions WHERE id = NEW.mission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid assignment relationship' USING ERRCODE = '23503';
  END IF;
  SELECT property_id INTO v_reservation_property_id FROM public.reservations
    WHERE id = v_mission.reservation_id;
  SELECT * INTO v_intervention FROM public.provider_interventions
    WHERE id = NEW.provider_intervention_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid assignment relationship' USING ERRCODE = '23503';
  END IF;
  IF v_intervention.provider_profile_id IS DISTINCT FROM NEW.provider_profile_id
    OR v_intervention.owner_profile_id IS DISTINCT FROM v_mission.owner_profile_id
    OR v_intervention.reservation_id IS DISTINCT FROM v_mission.reservation_id
    OR NEW.owner_profile_id IS DISTINCT FROM v_mission.owner_profile_id
    OR NEW.reservation_id IS DISTINCT FROM v_mission.reservation_id
    OR NEW.reservation_property_id IS DISTINCT FROM v_reservation_property_id THEN
    RAISE EXCEPTION 'Inconsistent assignment relationship' USING ERRCODE = '23514';
  END IF;
  NEW.assigned_at := clock_timestamp();
  RETURN NEW;
END;
$function$;

-- SECURITY DEFINER est nécessaire ici: les clients ne peuvent pas lire la
-- nouvelle table. Un trigger INVOKER casserait même les mises à jour autonomes.
-- Aucun paramètre SQL dynamique; aucune exemption du propriétaire/service_role.
CREATE FUNCTION public.guard_assigned_resource_identity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'missions' THEN
    IF ROW(NEW.owner_profile_id, NEW.reservation_id, NEW.property_id)
      IS DISTINCT FROM ROW(OLD.owner_profile_id, OLD.reservation_id, OLD.property_id)
      AND EXISTS (SELECT 1 FROM public.mission_provider_assignments WHERE mission_id = OLD.id) THEN
      RAISE EXCEPTION 'Assigned mission ownership, reservation and property are protected' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'provider_interventions' THEN
    IF ROW(NEW.provider_profile_id, NEW.owner_profile_id, NEW.reservation_id)
      IS DISTINCT FROM ROW(OLD.provider_profile_id, OLD.owner_profile_id, OLD.reservation_id)
      AND EXISTS (SELECT 1 FROM public.mission_provider_assignments WHERE provider_intervention_id = OLD.id) THEN
      RAISE EXCEPTION 'Assigned intervention identity is protected' USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'reservations' THEN
    IF EXISTS (SELECT 1 FROM public.mission_provider_assignments a WHERE a.reservation_id = OLD.id
      AND (a.owner_profile_id IS DISTINCT FROM NEW.owner_profile_id
        OR (a.reservation_property_id IS NOT NULL
          AND a.reservation_property_id IS DISTINCT FROM NEW.property_id))) THEN
      RAISE EXCEPTION 'Assigned reservation ownership and verified property are protected' USING ERRCODE = '23514';
    END IF;
    -- Concierge, dates, statut et notes ne sont pas figés. Un logement NULL à
    -- l'affectation ne prouve aucun logement: sa saisie ultérieure reste possible,
    -- sans réécrire l'instantané ni donner un droit sur ce logement à l'artisan.
  ELSE
    RAISE EXCEPTION 'Unsupported assignment guard target' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_mission_provider_assignment() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.guard_assigned_resource_identity() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.lock_mission_assignment_scope(UUID) FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER mission_provider_assignments_integrity_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.mission_provider_assignments
  FOR EACH ROW EXECUTE FUNCTION public.guard_mission_provider_assignment();
CREATE TRIGGER missions_assignment_identity_guard
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.guard_assigned_resource_identity();
CREATE TRIGGER provider_interventions_assignment_identity_guard
  BEFORE UPDATE ON public.provider_interventions
  FOR EACH ROW EXECUTE FUNCTION public.guard_assigned_resource_identity();
CREATE TRIGGER reservations_assignment_identity_guard
  BEFORE UPDATE OF owner_profile_id, property_id ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_assigned_resource_identity();

ALTER TABLE public.mission_provider_assignments ENABLE ROW LEVEL SECURITY;
-- Aucune policy client. Pas de séquence (UUID), pas de DML/TRUNCATE/TRIGGER
-- pour service_role: écritures uniquement via les RPC restreintes suivantes.
REVOKE ALL ON TABLE public.mission_provider_assignments FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.mission_provider_assignments TO service_role;

-- Les ACL par défaut peuvent viser des rôles supplémentaires: refuser la
-- migration plutôt que supprimer globalement leurs privilèges historiques.
DO $acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c
    CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))) a
    WHERE c.oid = 'public.mission_provider_assignments'::regclass
      AND a.grantee <> c.relowner
      AND NOT (a.grantee = 'service_role'::regrole AND a.privilege_type = 'SELECT' AND NOT a.is_grantable))
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
      WHERE p.oid IN ('public.guard_mission_provider_assignment()'::regprocedure,
        'public.guard_assigned_resource_identity()'::regprocedure,
        'public.lock_mission_assignment_scope(uuid)'::regprocedure)
        AND (p.proowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)
          OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(coalesce(p.proacl,
            pg_catalog.acldefault('f', p.proowner))) a WHERE a.grantee <> p.proowner))) THEN
    RAISE EXCEPTION 'Unexpected assignment object ACL or owner' USING ERRCODE = '42501';
  END IF;
END;
$acl$;

-- Suppressions: RESTRICT bloque mission/intervention/prestataire et acteurs,
-- même après révocation. Les cascades profiles -> missions/interventions et
-- les SET NULL owner/réservation sont donc refusés si l'historique les référence.
-- Une intervention autonome reste supprimable selon les politiques existantes.
-- Transfert propriétaire/réservation d'une ressource affectée: refus conservateur,
-- à traiter par une procédure distincte explicitement autorisée, jamais silencieuse.
-- Retour arrière proposé AVANT données: supprimer les RPC, les quatre triggers,
-- leurs fonctions/helpers, la table vide puis les trois contraintes uniques
-- ajoutées sur interventions/réservations; sans CASCADE.
-- APRÈS données: sauvegarde/export contrôlé et décision de conservation requis;
-- ne pas supprimer l'historique automatiquement. Aucun rollback exécuté ici.
COMMIT;
