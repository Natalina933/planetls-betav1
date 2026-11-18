-- P1-COL-03B: complément local NON EXÉCUTÉ. Ne modifie aucun objet G03.
-- Permet un rejeu avant géocodage/éligibilité variables; zéro écriture métier.
BEGIN;
SET LOCAL lock_timeout = '3s';
DO $preflight$
DECLARE v_owner oid;
BEGIN
  SELECT oid INTO v_owner FROM pg_catalog.pg_roles WHERE rolname = current_user AND (rolsuper OR rolbypassrls);
  IF v_owner IS NULL OR (SELECT relowner FROM pg_catalog.pg_class WHERE oid = 'public.provider_solicitation_operations'::regclass) <> v_owner
    OR (SELECT proowner FROM pg_catalog.pg_proc WHERE oid = 'public.assert_provider_solicitation_actor(uuid,uuid)'::regprocedure) <> v_owner
    OR EXISTS (SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role') AND
      (r.oid = v_owner OR r.rolsuper OR r.rolcreaterole OR pg_catalog.pg_has_role(r.oid,v_owner,'MEMBER')
       OR pg_catalog.has_schema_privilege(r.oid,'public','CREATE')
       OR (r.rolname IN ('anon','authenticated') AND (r.rolbypassrls OR pg_catalog.pg_has_role(r.oid,'service_role'::regrole,'MEMBER'))))) THEN
    RAISE EXCEPTION 'Untrusted solicitation replay owner' USING ERRCODE = '42501'; END IF;
END;
$preflight$;

CREATE FUNCTION public.lookup_provider_solicitation_creation(p_principal_id uuid,p_actor_id uuid,p_idempotency_key uuid,p_parameters jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog SET timezone = 'UTC' AS $function$
DECLARE v_role text; v_hash text; v_op public.provider_solicitation_operations%ROWTYPE;
BEGIN
  v_role := public.assert_provider_solicitation_actor(p_principal_id,p_actor_id);
  IF v_role NOT IN ('owner','owner_pro') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501'; END IF;
  IF p_idempotency_key IS NULL OR p_parameters IS NULL OR jsonb_typeof(p_parameters) <> 'object'
    OR (p_parameters - ARRAY['provider_profile_id','service_slug','description','location','reservation_id','desired_at']) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023'; END IF;
  -- Même empreinte que create_provider_solicitation (test statique de concordance).
  v_hash := encode(sha256(convert_to(jsonb_build_object('provider_profile_id',p_parameters->>'provider_profile_id',
    'service_slug',p_parameters->>'service_slug','description',btrim(p_parameters->>'description'),
    'location',p_parameters->'location','reservation_id',p_parameters->>'reservation_id',
    'desired_at',(p_parameters->>'desired_at')::timestamptz)::text,'UTF8')),'hex');
  SELECT * INTO v_op FROM public.provider_solicitation_operations WHERE principal_profile_id = p_principal_id
    AND actor_profile_id = p_actor_id AND idempotency_key = p_idempotency_key;
  IF NOT FOUND THEN RETURN jsonb_build_object('found',false); END IF;
  IF v_op.command <> 'create' OR v_op.request_fingerprint <> v_hash THEN
    RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = '23505'; END IF;
  RETURN jsonb_build_object('found',true,'result',v_op.result,'operation_id',v_op.id,'replayed',true);
END;
$function$;
REVOKE ALL ON FUNCTION public.lookup_provider_solicitation_creation(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.lookup_provider_solicitation_creation(uuid,uuid,uuid,jsonb) TO service_role;
DO $acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
    WHERE p.oid = 'public.lookup_provider_solicitation_creation(uuid,uuid,uuid,jsonb)'::regprocedure
      AND (p.proowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)
        OR (a.grantee <> p.proowner AND NOT (a.grantee = 'service_role'::regrole AND a.privilege_type = 'EXECUTE' AND NOT a.is_grantable)))) THEN
    RAISE EXCEPTION 'Unexpected solicitation replay ACL' USING ERRCODE = '42501'; END IF;
END;
$acl$;
-- Avant application: bases fraîche/existante, RLS/ACL, autorisés/refusés,
-- conflit/rejeu concurrent avec création, révocation pendant lecture.
-- Sauvegarde/prévisualisation requises. Retour arrière sans toucher aux données:
-- désactiver l'API, conserver les tables et l'historique. Aucun DROP automatique.
COMMIT;
