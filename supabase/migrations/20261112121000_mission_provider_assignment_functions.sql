-- SEC-AUTH-01B2B4C1A: préparation locale, non appliquée.
-- Dépend de 20261112120000. Propriétaire SQL de confiance obligatoire.
-- CONTRAT D'APPEL: service_role seul. Le serveur DOIT authentifier le principal,
-- refuser un ancien claim admin rétrogradé, résoudre/vérifier le profil actif,
-- puis transmettre les deux identités. Aucun UUID fourni n'authentifie son porteur.
-- Cette migration ne change aucun handler ni aucune autorisation de lecture.
BEGIN;
SET LOCAL lock_timeout = '3s';

-- Même propriétaire que M1 et les objets historiques de sécurité. Pas de
-- changement arbitraire de propriétaire, pas de confiance dans son seul nom.
DO $preflight$
DECLARE
  v_owner OID;
BEGIN
  SELECT oid INTO v_owner FROM pg_catalog.pg_roles WHERE rolname = current_user
    AND (rolsuper OR rolbypassrls);
  IF v_owner IS NULL OR EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE oid IN (
    'public.missions'::regclass, 'public.provider_interventions'::regclass,
    'public.reservations'::regclass, 'public.profiles'::regclass,
    'public.mission_provider_assignments'::regclass) AND relowner <> v_owner)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE oid IN (
      'public.guard_profile_authorization_attributes()'::regprocedure,
      'public.guard_mission_provider_assignment()'::regprocedure,
      'public.guard_assigned_resource_identity()'::regprocedure,
      'public.lock_mission_assignment_scope(uuid)'::regprocedure) AND proowner <> v_owner)
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r
      WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
        AND (r.oid = v_owner OR r.rolsuper OR r.rolcreaterole
          OR (r.rolname IN ('anon', 'authenticated') AND (r.rolbypassrls
            OR pg_catalog.pg_has_role(r.oid, 'service_role'::regrole, 'MEMBER')))
          OR pg_catalog.pg_has_role(r.oid, v_owner, 'MEMBER')
          OR pg_catalog.has_schema_privilege(r.oid, 'public', 'CREATE'))) THEN
    RAISE EXCEPTION 'Untrusted assignment function ownership or role inheritance' USING ERRCODE = '42501';
  END IF;
END;
$preflight$;

-- Helper interne non exposé à service_role. L'association multi-profil reste
-- vérifiée par le serveur; la comparaison persistée ci-dessous est un contrôle
-- supplémentaire suivant apiAuth, pas une nouvelle preuve d'identité autonome.
CREATE FUNCTION public.assert_mission_assignment_actor(
  p_principal_id UUID, p_actor_id UUID, p_mission_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_principal public.profiles%ROWTYPE;
  v_actor public.profiles%ROWTYPE;
  v_mission public.missions%ROWTYPE;
BEGIN
  IF p_principal_id IS NULL OR p_actor_id IS NULL OR p_mission_id IS NULL THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
  -- Appelant: verrou d'opération éventuel, profils triés, réservation, mission.
  -- FOR SHARE empêche une suspension/rétrogradation entre contrôle et écriture,
  -- sans sérialiser toutes les opérations partageant le même administrateur.
  PERFORM id FROM public.profiles WHERE id IN (p_principal_id, p_actor_id)
    ORDER BY id FOR SHARE;
  SELECT * INTO v_principal FROM public.profiles WHERE id = p_principal_id;
  SELECT * INTO v_actor FROM public.profiles WHERE id = p_actor_id;
  -- Même normalisation que principalRights; aucun fallback sur category/JWT.
  v_principal.role := lower(btrim(v_principal.role));
  v_actor.role := lower(btrim(v_actor.role));
  IF v_principal.id IS NULL OR v_actor.id IS NULL
    OR v_principal.status IS DISTINCT FROM 'active' OR v_actor.status IS DISTINCT FROM 'active'
    OR NOT coalesce(v_principal.role IN ('owner', 'owner_pro', 'concierge', 'concierge_pro',
      'provider', 'provider_pro', 'artisan', 'artisan_pro', 'admin', 'super_admin'), false) THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
  IF p_principal_id <> p_actor_id AND NOT coalesce(
    length(v_principal.email) > 0 AND (
      lower(v_actor.email) = lower(v_principal.email)
      OR strpos(lower(coalesce(v_actor.additional_info, '')),
        'workspace_parent_email:' || lower(v_principal.email)) > 0), false) THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
  -- Préfiltrage des rôles avant lecture de la mission privée.
  IF NOT coalesce(v_actor.role IN ('concierge', 'concierge_pro', 'admin', 'super_admin'), false)
    OR (v_actor.role IN ('admin', 'super_admin')
      AND NOT coalesce(v_principal.role IN ('admin', 'super_admin'), false)) THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
  PERFORM public.lock_mission_assignment_scope(p_mission_id);
  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id;
  IF NOT FOUND OR (v_actor.role NOT IN ('admin', 'super_admin')
    AND v_mission.concierge_profile_id IS DISTINCT FROM p_actor_id) THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
END;
$function$;

CREATE FUNCTION public.create_mission_provider_assignment(
  p_principal_id UUID,
  p_actor_id UUID,
  p_mission_id UUID,
  p_provider_id UUID,
  p_operation_id UUID,
  p_parameters JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_mission public.missions%ROWTYPE;
  v_provider public.profiles%ROWTYPE;
  v_assignment public.mission_provider_assignments%ROWTYPE;
  v_intervention public.provider_interventions%ROWTYPE;
  v_fingerprint TEXT;
  v_title TEXT;
  v_key TEXT;
  v_reservation_property_id UUID;
BEGIN
  IF p_operation_id IS NULL OR p_provider_id IS NULL OR p_principal_id IS NULL OR p_actor_id IS NULL
    OR p_mission_id IS NULL OR p_parameters IS NULL OR jsonb_typeof(p_parameters) <> 'object' THEN
    RAISE EXCEPTION 'Invalid assignment parameters' USING ERRCODE = '22023';
  END IF;
  IF (p_parameters - ARRAY['title', 'description', 'service_label', 'priority',
    'scheduled_start', 'scheduled_end', 'budget_amount', 'location_label']) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'Unsupported assignment parameters' USING ERRCODE = '22023';
  END IF;
  FOREACH v_key IN ARRAY ARRAY['title', 'description', 'service_label', 'priority',
    'scheduled_start', 'scheduled_end', 'location_label'] LOOP
    IF p_parameters ? v_key AND jsonb_typeof(p_parameters -> v_key) NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Invalid assignment parameters' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF p_parameters ? 'budget_amount' AND jsonb_typeof(p_parameters -> 'budget_amount') NOT IN ('number', 'null') THEN
    RAISE EXCEPTION 'Invalid assignment parameters' USING ERRCODE = '22023';
  END IF;

  -- Clé globale; collision du hash = sérialisation supplémentaire, jamais octroi.
  PERFORM pg_advisory_xact_lock(hashtextextended('mission-provider-assignment:' || p_operation_id::text, 0));
  -- Même ordre de profils dans toutes les créations, y compris le prestataire.
  PERFORM id FROM public.profiles WHERE id IN (p_principal_id, p_actor_id, p_provider_id)
    ORDER BY id FOR SHARE;
  PERFORM public.assert_mission_assignment_actor(p_principal_id, p_actor_id, p_mission_id);
  SELECT * INTO v_provider FROM public.profiles WHERE id = p_provider_id;
  v_provider.role := lower(btrim(v_provider.role));
  IF v_provider.id IS NULL OR v_provider.status IS DISTINCT FROM 'active'
    OR NOT coalesce(v_provider.role IN ('provider', 'provider_pro', 'artisan', 'artisan_pro'), false) THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id;
  SELECT property_id INTO v_reservation_property_id FROM public.reservations WHERE id = v_mission.reservation_id;

  -- Empreinte du corps JSONB et des identités, pas de valeurs par défaut relues
  -- dans une mission mutable. Même clé/corps après modification de la mission:
  -- renvoyer le résultat initial, sans recréer événement/alerte/intervention.
  v_fingerprint := encode(sha256(convert_to(jsonb_build_object(
    'principal_id', p_principal_id, 'actor_id', p_actor_id, 'mission_id', p_mission_id,
    'provider_id', p_provider_id, 'parameters', p_parameters)::text, 'UTF8')), 'hex');
  SELECT * INTO v_assignment FROM public.mission_provider_assignments
    WHERE operation_id = p_operation_id FOR UPDATE;
  IF FOUND THEN
    IF v_assignment.business_fingerprint <> v_fingerprint THEN
      RAISE EXCEPTION 'Idempotency key reused with different parameters' USING ERRCODE = '22023';
    END IF;
    IF v_assignment.state <> 'active' THEN
      RAISE EXCEPTION 'Assignment was revoked' USING ERRCODE = '55000';
    END IF;
    SELECT * INTO STRICT v_intervention FROM public.provider_interventions
      WHERE id = v_assignment.provider_intervention_id FOR UPDATE;
    IF v_intervention.provider_profile_id IS DISTINCT FROM p_provider_id
      OR v_intervention.owner_profile_id IS DISTINCT FROM v_mission.owner_profile_id
      OR v_intervention.reservation_id IS DISTINCT FROM v_mission.reservation_id
      OR (v_assignment.reservation_property_id IS NOT NULL
        AND v_assignment.reservation_property_id IS DISTINCT FROM v_reservation_property_id) THEN
      RAISE EXCEPTION 'Inconsistent persisted assignment' USING ERRCODE = '23514';
    END IF;
    RETURN jsonb_build_object('assignment', to_jsonb(v_assignment), 'intervention', to_jsonb(v_intervention), 'replayed', true);
  END IF;

  v_title := coalesce(nullif(btrim(p_parameters ->> 'title'), ''),
    'Intervention - ' || coalesce(to_jsonb(v_mission) ->> 'title', to_jsonb(v_mission) ->> 'service_label', 'mission'));
  INSERT INTO public.provider_interventions (
    provider_profile_id, owner_profile_id, reservation_id, title, description, service_label,
    status, priority, scheduled_start, scheduled_end, budget_amount, currency, location_label, metadata
  ) VALUES (
    p_provider_id, v_mission.owner_profile_id, v_mission.reservation_id, v_title,
    coalesce(p_parameters ->> 'description', v_mission.description), p_parameters ->> 'service_label',
    'pending', coalesce(p_parameters ->> 'priority', 'normal'),
    coalesce((p_parameters ->> 'scheduled_start')::timestamptz, v_mission.scheduled_start),
    coalesce((p_parameters ->> 'scheduled_end')::timestamptz, v_mission.scheduled_end),
    coalesce((p_parameters ->> 'budget_amount')::numeric, v_mission.amount),
    coalesce(v_mission.currency, 'EUR'), p_parameters ->> 'location_label',
    jsonb_build_object('mission_id', p_mission_id, 'created_from', 'mission_detail',
      'concierge_profile_id', v_mission.concierge_profile_id)
  ) RETURNING * INTO v_intervention;

  INSERT INTO public.mission_provider_assignments (
    mission_id, provider_intervention_id, provider_profile_id,
    assigned_by_principal_id, assigned_by_profile_id, operation_id, business_fingerprint,
    owner_profile_id, reservation_id, reservation_property_id
  ) VALUES (
    p_mission_id, v_intervention.id, p_provider_id, p_principal_id, p_actor_id,
    p_operation_id, v_fingerprint, v_mission.owner_profile_id, v_mission.reservation_id, v_reservation_property_id
  ) RETURNING * INTO v_assignment;

  -- Pointeur de compatibilité uniquement; ne prouve jamais une affectation.
  UPDATE public.missions SET metadata =
    (CASE WHEN jsonb_typeof(metadata) = 'object' THEN metadata ELSE '{}'::jsonb END)
      || jsonb_build_object('provider_intervention_status', 'pending', 'provider_intervention_id', v_intervention.id)
    WHERE id = p_mission_id;
  INSERT INTO public.mission_events(mission_id, actor_profile_id, event_type, payload)
    VALUES (p_mission_id, p_actor_id, 'updated', jsonb_build_object(
      'action', 'provider_intervention_created', 'provider_intervention_id', v_intervention.id,
      'provider_profile_id', p_provider_id, 'assignment_id', v_assignment.id, 'operation_id', p_operation_id));
  INSERT INTO public.provider_alerts(provider_profile_id, intervention_id, alert_type, severity, title, body, status)
    VALUES (p_provider_id, v_intervention.id, 'deadline',
      CASE WHEN v_intervention.priority = 'urgent' THEN 'urgent' ELSE 'normal' END,
      'Nouvelle intervention liée à une mission', v_title, 'open');
  -- Aucun EXCEPTION avalant une erreur: toute défaillance annule tout le statement,
  -- y compris l'intervention, le pointeur, l'affectation, l'événement et l'alerte.
  RETURN jsonb_build_object('assignment', to_jsonb(v_assignment), 'intervention', to_jsonb(v_intervention), 'replayed', false);
END;
$function$;

-- Révocation terminale seulement. Aucun changement automatique du statut métier
-- de la mission/intervention, de facture, de rapport ou de justificatif.
CREATE FUNCTION public.revoke_mission_provider_assignment(
  p_principal_id UUID, p_actor_id UUID, p_assignment_id UUID, p_reason TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  v_assignment public.mission_provider_assignments%ROWTYPE;
BEGIN
  IF p_assignment_id IS NULL OR p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Invalid revocation parameters' USING ERRCODE = '22023';
  END IF;
  -- Lecture interne minimale pour trouver la mission; aucune donnée retournée
  -- avant contrôle des droits. La liaison ne peut ni être modifiée ni supprimée.
  SELECT * INTO v_assignment FROM public.mission_provider_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment authorization denied' USING ERRCODE = '42501';
  END IF;
  PERFORM public.assert_mission_assignment_actor(p_principal_id, p_actor_id, v_assignment.mission_id);
  SELECT * INTO STRICT v_assignment FROM public.mission_provider_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF v_assignment.state = 'revoked' THEN
    IF v_assignment.revoked_by_principal_id IS DISTINCT FROM p_principal_id
      OR v_assignment.revoked_by_profile_id IS DISTINCT FROM p_actor_id
      OR v_assignment.revocation_reason IS DISTINCT FROM btrim(p_reason) THEN
      RAISE EXCEPTION 'Revocation is immutable' USING ERRCODE = '55000';
    END IF;
    RETURN to_jsonb(v_assignment);
  END IF;
  UPDATE public.mission_provider_assignments SET state = 'revoked',
    revoked_at = clock_timestamp(), revoked_by_principal_id = p_principal_id,
    revoked_by_profile_id = p_actor_id, revocation_reason = btrim(p_reason)
    WHERE id = p_assignment_id RETURNING * INTO v_assignment;
  RETURN to_jsonb(v_assignment);
END;
$function$;

REVOKE ALL ON FUNCTION public.assert_mission_assignment_actor(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_mission_provider_assignment(UUID, UUID, UUID, UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.revoke_mission_provider_assignment(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_mission_provider_assignment(UUID, UUID, UUID, UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_mission_provider_assignment(UUID, UUID, UUID, TEXT) TO service_role;

-- Refuser aussi les ACL héritées de DEFAULT PRIVILEGES vers d'autres rôles.
-- Le helper reste interne; seules les deux RPC acceptent EXECUTE service_role.
DO $acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
    WHERE p.oid IN ('public.assert_mission_assignment_actor(uuid,uuid,uuid)'::regprocedure,
      'public.create_mission_provider_assignment(uuid,uuid,uuid,uuid,uuid,jsonb)'::regprocedure,
      'public.revoke_mission_provider_assignment(uuid,uuid,uuid,text)'::regprocedure)
      AND (p.proowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)
        OR EXISTS (SELECT 1 FROM pg_catalog.aclexplode(coalesce(p.proacl,
          pg_catalog.acldefault('f', p.proowner))) a WHERE a.grantee <> p.proowner
          AND NOT (p.oid <> 'public.assert_mission_assignment_actor(uuid,uuid,uuid)'::regprocedure
            AND a.grantee = 'service_role'::regrole AND a.privilege_type = 'EXECUTE' AND NOT a.is_grantable)))) THEN
    RAISE EXCEPTION 'Unexpected assignment function ACL or owner' USING ERRCODE = '42501';
  END IF;
END;
$acl$;

-- Validation PostgreSQL OBLIGATOIRE avant application: base fraîche et existante,
-- propriétaire/ACL réels (y compris privilèges par défaut), RLS/accès inter-rôles,
-- triggers et cascades, concurrence création/révocation/suspension/changement de
-- liens, rollback atomique après chaque écriture, types/colonnes historiques,
-- sha256(bytea), deadlocks/retry côté serveur. Pas de validation PostgreSQL ici.
-- Ces RPC ne remplacent ni l'authentification HTTP ni la vérification des claims
-- périmés; aucun raccordement API ni correction globale du P0 dans ce sous-lot.
-- Verrous: opération (création), profils FOR SHARE triés, réservation FOR UPDATE,
-- mission FOR UPDATE, affectation existante, intervention. Le trigger d'insertion
-- reprend des verrous déjà détenus. Les autres parcours historiques peuvent
-- suivre un ordre différent: 40P01/40001 restent possibles, reprise complète
-- avec même clé uniquement après relecture des droits. Le lock_timeout de cette
-- migration n'est PAS un timeout des RPC: configurer des délais serveur bornés.
-- Blocage avant application: vérifier les propriétaires/adhésions/ACL réels,
-- valider ces précontrôles, FK et verrous sous PostgreSQL 17 frais/existant.
-- Aucun catalogue réel n'a été interrogé et aucune confiance n'est certifiée ici.
COMMIT;
