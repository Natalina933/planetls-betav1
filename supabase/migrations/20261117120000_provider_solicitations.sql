-- P1-COL-03A / lot A: préparation locale uniquement, NON EXÉCUTÉE.
-- Aucun raccordement HTTP, aucune affectation G03, mission, facture ou paiement.
-- Le serveur authentifie le principal Auth.js avant de passer ces UUID.
-- Aucun UUID ni session Auth.js ne devient implicitement un JWT Supabase.
-- Avant application: prévisualisation/ACL, sauvegarde, bases fraîche ET existante,
-- concurrence réelle, rollback et tests RLS obligatoires. Aucun backfill.
BEGIN;
SET LOCAL lock_timeout = '3s';

DO $preflight$
DECLARE v_owner oid;
BEGIN
  SELECT oid INTO v_owner FROM pg_catalog.pg_roles WHERE rolname = current_user AND (rolsuper OR rolbypassrls);
  IF v_owner IS NULL OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_class WHERE oid IN ('public.profiles'::regclass,
      'public.properties'::regclass, 'public.housing'::regclass, 'public.reservations'::regclass)
      AND relowner <> v_owner
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role') AND
      (r.oid = v_owner OR r.rolsuper OR r.rolcreaterole OR
       (r.rolname IN ('anon','authenticated') AND (r.rolbypassrls OR pg_catalog.pg_has_role(r.oid,'service_role'::regrole,'MEMBER')))
       OR pg_catalog.pg_has_role(r.oid,v_owner,'MEMBER') OR pg_catalog.has_schema_privilege(r.oid,'public','CREATE'))
  ) THEN RAISE EXCEPTION 'Untrusted solicitation owner or role inheritance' USING ERRCODE = '42501'; END IF;
END;
$preflight$;

-- Instantané versionné du catalogue canonique au 17 novembre 2026.
-- Aucun groupe ni libellé libre. Test de concordance TS/SQL dans le lot A.
CREATE FUNCTION public.is_provider_solicitation_service(p_slug text,p_label text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $catalog$
  SELECT EXISTS (SELECT 1 FROM (VALUES
    ('cleaning_standard','Ménage du logement'),
    ('cleaning_turnover','Ménage entre deux séjours'),
    ('cleaning_deep','Grand ménage'),
    ('linen_change','Changement de linge'),
    ('linen_laundry_full','Blanchisserie'),
    ('linen_supply','Fourniture de linge'),
    ('guest_checkin_checkout','Check-in & Check-out'),
    ('guest_checkin','Check-in'),
    ('guest_checkout','Check-out'),
    ('guest_support_during_stay','Assistance voyageurs'),
    ('guest_home_tour','Visite et présentation du logement'),
    ('plumbing_repair','Dépannage plomberie'),
    ('electrical_repair','Dépannage électrique'),
    ('maintenance_lock_troubleshooting','Serrurerie et dépannage des accès'),
    ('maintenance_condition_check','Contrôle et entretien du logement'),
    ('bathroom_renovation','Rénovation salle de bain'),
    ('kitchen_renovation','Rénovation cuisine'),
    ('full_renovation','Rénovation complète'),
    ('roof_drainage_maintenance','Toitures et évacuations'),
    ('seasonal_outdoor_maintenance','Entretien saisonnier'),
    ('real_estate_photography','Photographie immobilière'),
    ('admin_professional_photography','Photographie professionnelle'),
    ('presentation_video','Vidéo de présentation'),
    ('drone_photography','Prises de vue par drone'),
    ('virtual_tour_360','Visite virtuelle 360°'),
    ('visual_enhancement','Retouche et valorisation visuelle'),
    ('interior_decoration_consulting','Conseil en décoration intérieure'),
    ('home_staging','Home staging'),
    ('space_planning_decoration','Aménagement et décoration'),
    ('seasonal_decoration','Décoration saisonnière'),
    ('social_media_management','Gestion des réseaux sociaux'),
    ('content_creation','Création de contenus'),
    ('website_creation','Création de site internet'),
    ('marketing_strategy','Stratégie marketing et communication'),
    ('admin_booking_management','Gestion des réservations'),
    ('financial_reporting','Suivi financier et reporting'),
    ('maintenance_provider_coordination','Coordination des prestataires'),
    ('property_inventory_inspection','États des lieux et inventaires'),
    ('deposits_disputes_management','Gestion des cautions et litiges')
  ) AS catalog(slug,label) WHERE slug = p_slug AND label = p_label);
$catalog$;

CREATE TABLE public.provider_solicitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  prospective_client_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_slug text NOT NULL CHECK (service_slug ~ '^[a-z][a-z0-9_]{0,99}$'),
  service_label_snapshot text NOT NULL CHECK (length(btrim(service_label_snapshot)) BETWEEN 1 AND 200),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 5000),
  location_kind text NOT NULL CHECK (location_kind IN ('property','housing','address')),
  property_id uuid REFERENCES public.properties(id) ON DELETE RESTRICT,
  housing_id bigint REFERENCES public.housing(id) ON DELETE RESTRICT CHECK (housing_id > 0),
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE RESTRICT,
  location_label text NOT NULL CHECK (length(btrim(location_label)) BETWEEN 1 AND 700),
  city text NOT NULL CHECK (length(btrim(city)) BETWEEN 1 AND 200),
  postal_code text NOT NULL CHECK (length(btrim(postal_code)) BETWEEN 1 AND 20),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  geocoded_at timestamptz NOT NULL CHECK (isfinite(geocoded_at)),
  geocoding_source text NOT NULL CHECK (length(btrim(geocoding_source)) BETWEEN 1 AND 100),
  desired_at timestamptz CHECK (desired_at IS NULL OR isfinite(desired_at)),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','interested','declined')),
  response_message text CHECK (response_message IS NULL OR length(btrim(response_message)) BETWEEN 1 AND 2000),
  responded_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  creation_operation_id uuid NOT NULL UNIQUE,
  business_fingerprint text NOT NULL CHECK (business_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (owner_profile_id = prospective_client_profile_id AND owner_profile_id <> provider_profile_id),
  CHECK (public.is_provider_solicitation_service(service_slug,service_label_snapshot)),
  CHECK ((location_kind = 'property' AND property_id IS NOT NULL AND housing_id IS NULL)
    OR (location_kind = 'housing' AND housing_id IS NOT NULL AND property_id IS NULL)
    OR (location_kind = 'address' AND property_id IS NULL AND housing_id IS NULL)),
  -- Pas de lien séjour/logement historique deviné. Un séjour est relié à sa propriété canonique.
  CHECK (reservation_id IS NULL OR (location_kind = 'property' AND property_id IS NOT NULL)),
  CHECK ((status = 'sent' AND version = 1 AND responded_at IS NULL AND response_message IS NULL)
    OR (status IN ('interested','declined') AND version = 2 AND responded_at IS NOT NULL)),
  CHECK (updated_at >= created_at AND (responded_at IS NULL OR responded_at >= created_at))
);
CREATE UNIQUE INDEX provider_solicitations_open_business_key
  ON public.provider_solicitations(owner_profile_id,provider_profile_id,business_fingerprint) WHERE status = 'sent';
CREATE INDEX provider_solicitations_owner_page ON public.provider_solicitations(owner_profile_id,created_at DESC,id DESC);
CREATE INDEX provider_solicitations_provider_page ON public.provider_solicitations(provider_profile_id,created_at DESC,id DESC);
CREATE INDEX provider_solicitations_owner_status ON public.provider_solicitations(owner_profile_id,status,created_at DESC,id DESC);
CREATE INDEX provider_solicitations_provider_status ON public.provider_solicitations(provider_profile_id,status,created_at DESC,id DESC);

CREATE TABLE public.provider_solicitation_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  command text NOT NULL CHECK (command IN ('create','respond')),
  idempotency_key uuid NOT NULL,
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  solicitation_id uuid NOT NULL REFERENCES public.provider_solicitations(id) ON DELETE RESTRICT,
  result jsonb NOT NULL CHECK ((jsonb_typeof(result) = 'object'
    AND result ?& ARRAY['solicitation_id','status','version']
    AND result->>'solicitation_id' = solicitation_id::text
    AND ((command = 'create' AND result->>'status' = 'sent' AND result->>'version' = '1')
      OR (command = 'respond' AND result->>'status' IN ('interested','declined') AND result->>'version' = '2'))) IS TRUE),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (principal_profile_id = actor_profile_id),
  UNIQUE(principal_profile_id,actor_profile_id,idempotency_key),
  UNIQUE(id,solicitation_id)
);
ALTER TABLE public.provider_solicitations ADD CONSTRAINT provider_solicitations_creation_operation_fk
  FOREIGN KEY (creation_operation_id,id) REFERENCES public.provider_solicitation_operations(id,solicitation_id)
  ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE public.provider_solicitation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitation_id uuid NOT NULL REFERENCES public.provider_solicitations(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('solicitation_sent','provider_interested','provider_declined')),
  actor_principal_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  old_status text,
  new_status text NOT NULL,
  version integer NOT NULL,
  message text CHECK (message IS NULL OR length(btrim(message)) BETWEEN 1 AND 2000),
  operation_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (operation_id,solicitation_id) REFERENCES public.provider_solicitation_operations(id,solicitation_id) ON DELETE RESTRICT,
  UNIQUE(solicitation_id,version),
  CHECK (actor_principal_id = actor_profile_id),
  CHECK (((event_type = 'solicitation_sent' AND old_status IS NULL AND new_status = 'sent' AND version = 1 AND message IS NULL)
    OR (event_type = 'provider_interested' AND old_status = 'sent' AND new_status = 'interested' AND version = 2)
    OR (event_type = 'provider_declined' AND old_status = 'sent' AND new_status = 'declined' AND version = 2)) IS TRUE)
);

ALTER TABLE public.provider_solicitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_solicitation_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_solicitation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_solicitations,public.provider_solicitation_operations,public.provider_solicitation_events
  FROM PUBLIC,anon,authenticated,service_role;
-- Zéro policy client: Auth.js passe par les RPC serveur authentifiées.

CREATE FUNCTION public.guard_provider_solicitation_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
BEGIN
  RAISE EXCEPTION 'Solicitation history is immutable' USING ERRCODE = '55000';
END;
$function$;
CREATE TRIGGER provider_solicitation_events_immutable BEFORE UPDATE OR DELETE ON public.provider_solicitation_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_solicitation_history();
CREATE TRIGGER provider_solicitation_operations_immutable BEFORE UPDATE OR DELETE ON public.provider_solicitation_operations
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_solicitation_history();

CREATE FUNCTION public.guard_provider_solicitation_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Solicitation deletion forbidden' USING ERRCODE = '55000'; END IF;
  IF OLD.status <> 'sent' OR NEW.status NOT IN ('interested','declined') OR NEW.version <> OLD.version + 1
    OR NEW.responded_at IS NULL OR NEW.updated_at <> NEW.responded_at
    OR (to_jsonb(NEW) - ARRAY['status','response_message','responded_at','version','updated_at'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','response_message','responded_at','version','updated_at']) THEN
    RAISE EXCEPTION 'Invalid solicitation transition' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER provider_solicitations_transition BEFORE UPDATE OR DELETE ON public.provider_solicitations
  FOR EACH ROW EXECUTE FUNCTION public.guard_provider_solicitation_transition();

-- Différé: les trois écritures doivent être cohérentes à la fin de la transaction.
CREATE FUNCTION public.check_provider_solicitation_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.provider_solicitation_events e
    JOIN public.provider_solicitation_operations o ON o.id = e.operation_id AND o.solicitation_id = e.solicitation_id
    WHERE e.solicitation_id = NEW.id AND e.version = NEW.version AND e.new_status = NEW.status
      AND e.message IS NOT DISTINCT FROM NEW.response_message
      AND e.actor_principal_id = o.principal_profile_id AND e.actor_profile_id = o.actor_profile_id
      AND o.result->>'status' = NEW.status AND o.result->>'version' = NEW.version::text
      AND ((NEW.version = 1 AND o.command = 'create' AND o.id = NEW.creation_operation_id AND e.actor_profile_id = NEW.owner_profile_id)
        OR (NEW.version = 2 AND o.command = 'respond' AND e.actor_profile_id = NEW.provider_profile_id))) THEN
    RAISE EXCEPTION 'Incomplete solicitation audit' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END;
$function$;
CREATE CONSTRAINT TRIGGER provider_solicitations_audit_complete AFTER INSERT OR UPDATE ON public.provider_solicitations
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_provider_solicitation_audit();

-- Lot A: principal = acteur seulement. Les profils liés sont refusés tant que
-- leur délégation structurée n'est pas qualifiée; aucun droit issu de JSON libre.
CREATE FUNCTION public.assert_provider_solicitation_actor(p_principal_id uuid,p_actor_id uuid) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
DECLARE v_role text; v_status text;
BEGIN
  IF p_principal_id IS NULL OR p_actor_id IS NULL OR p_principal_id <> p_actor_id THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501'; END IF;
  SELECT lower(btrim(role)),status INTO v_role,v_status FROM public.profiles WHERE id = p_actor_id FOR SHARE;
  IF NOT FOUND OR v_status IS DISTINCT FROM 'active' OR v_role IS NULL
    OR v_role NOT IN ('owner','owner_pro','provider','provider_pro','artisan','artisan_pro') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501'; END IF;
  RETURN v_role;
END;
$function$;

CREATE FUNCTION public.create_provider_solicitation(p_principal_id uuid,p_actor_id uuid,p_idempotency_key uuid,p_parameters jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog SET timezone = 'UTC' AS $function$
DECLARE
  v_role text; v_provider public.profiles%ROWTYPE; v_row public.provider_solicitations%ROWTYPE;
  v_operation public.provider_solicitation_operations%ROWTYPE;
  v_operation_id uuid := gen_random_uuid(); v_id uuid := gen_random_uuid();
  v_provider_id uuid; v_property_id uuid; v_housing_id bigint; v_reservation_id uuid;
  v_location jsonb; v_owner jsonb; v_value text; v_city text; v_address text;
  v_request_hash text; v_business_hash text; v_result jsonb; v_now timestamptz := clock_timestamp();
BEGIN
  IF p_idempotency_key IS NULL OR p_parameters IS NULL OR jsonb_typeof(p_parameters) <> 'object'
    OR (p_parameters - ARRAY['provider_profile_id','service_slug','service_label_snapshot','description','location',
      'reservation_id','desired_at','location_label','city','postal_code','country_code','latitude','longitude',
      'geocoded_at','geocoding_source','provider_declaration','location_declaration']) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023'; END IF;
  -- Empreinte des paramètres normalisés fournis par le serveur, pas des données
  -- géographiques volatiles recalculées. Lot B doit normaliser avant tout appel.
  v_request_hash := encode(sha256(convert_to(jsonb_build_object('provider_profile_id',p_parameters->>'provider_profile_id',
    'service_slug',p_parameters->>'service_slug','description',btrim(p_parameters->>'description'),
    'location',p_parameters->'location','reservation_id',p_parameters->>'reservation_id',
    'desired_at',(p_parameters->>'desired_at')::timestamptz)::text,'UTF8')),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended('provider-solicitation-op:' || p_actor_id::text || ':' || p_idempotency_key::text,0));
  v_provider_id := (p_parameters->>'provider_profile_id')::uuid;
  PERFORM id FROM public.profiles WHERE id IN (p_principal_id,p_actor_id,v_provider_id) ORDER BY id FOR SHARE;
  v_role := public.assert_provider_solicitation_actor(p_principal_id,p_actor_id);
  IF v_role NOT IN ('owner','owner_pro') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_operation FROM public.provider_solicitation_operations
    WHERE principal_profile_id = p_principal_id AND actor_profile_id = p_actor_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_operation.command <> 'create' OR v_operation.request_fingerprint <> v_request_hash THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = '23505'; END IF;
    RETURN jsonb_build_object('result',v_operation.result,'operation_id',v_operation.id,'replayed',true);
  END IF;
  SELECT * INTO v_provider FROM public.profiles WHERE id = v_provider_id;
  IF NOT FOUND OR v_provider.status IS DISTINCT FROM 'active' OR lower(btrim(v_provider.role)) IS NULL
    OR lower(btrim(v_provider.role)) NOT IN ('provider','provider_pro','artisan','artisan_pro') OR v_provider_id = p_actor_id THEN
    RAISE EXCEPTION 'INELIGIBLE_PROVIDER' USING ERRCODE = '42501'; END IF;
  IF p_parameters->'provider_declaration' IS DISTINCT FROM jsonb_build_object('option',v_provider.option,
    'availability_hours',v_provider.availability_hours,'service_radius_km',v_provider.service_radius_km,
    'latitude',v_provider.latitude,'longitude',v_provider.longitude) THEN
    RAISE EXCEPTION 'DECLARATION_CHANGED' USING ERRCODE = '40001'; END IF;
  -- Slug/libellé contrôlés par la contrainte catalogue versionnée; compétence,
  -- couverture et précision du point restent qualifiées par le serveur de confiance.
  v_now := clock_timestamp();
  IF (p_parameters->>'desired_at')::timestamptz < v_now THEN RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023'; END IF;
  v_location := p_parameters->'location';
  IF v_location IS NULL OR jsonb_typeof(v_location) <> 'object' THEN RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '22023'; END IF;
  v_property_id := (v_location->>'property_id')::uuid;
  v_housing_id := (v_location->>'housing_id')::bigint;
  v_reservation_id := (p_parameters->>'reservation_id')::uuid;
  IF v_reservation_id IS NOT NULL THEN
    -- Séjour facultatif; aucune lecture de voyageurs ni de consignes d'accès.
    PERFORM id FROM public.reservations WHERE id = v_reservation_id AND owner_profile_id = p_actor_id
      AND property_id = v_property_id FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_RESERVATION' USING ERRCODE = '42501'; END IF;
  END IF;
  IF v_location->>'kind' = 'property' THEN
    IF (v_location - ARRAY['kind','property_id']) <> '{}'::jsonb THEN RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '22023'; END IF;
    SELECT city INTO v_city FROM public.properties WHERE id = v_property_id AND owner_id = p_actor_id FOR SHARE;
    IF NOT FOUND OR v_city IS NULL OR btrim(v_city) = ''
      OR p_parameters->'location_declaration' IS DISTINCT FROM jsonb_build_object('city',v_city,'address',NULL::text) THEN
      RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '42501'; END IF;
  ELSIF v_location->>'kind' = 'housing' THEN
    IF (v_location - ARRAY['kind','housing_id']) <> '{}'::jsonb THEN RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '22023'; END IF;
    SELECT proprietaire,ville,adresse INTO v_owner,v_city,v_address FROM public.housing WHERE id = v_housing_id FOR SHARE;
    IF NOT FOUND OR jsonb_typeof(v_owner) IS DISTINCT FROM 'object'
      OR p_parameters->'location_declaration' IS DISTINCT FROM jsonb_build_object('city',v_city,'address',v_address)
      OR v_address IS NULL OR btrim(v_address) = '' THEN RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '42501'; END IF;
    v_value := NULL;
    FOR v_address IN SELECT value FROM jsonb_each_text(v_owner) WHERE key IN
      ('owner_profile_id','owner_id','proprietaire_id','id','userId','profile_id') LOOP
      IF v_address IS NOT NULL AND v_address <> '' THEN
        IF v_address <> p_actor_id::text THEN RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '42501'; END IF;
        v_value := v_address;
      END IF;
    END LOOP;
    IF v_value IS NULL THEN RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '42501'; END IF;
  ELSIF v_location->>'kind' = 'address' THEN
    IF (v_location - ARRAY['kind','address','city','postal_code','country_code']) <> '{}'::jsonb
      OR length(btrim(coalesce(v_location->>'address',''))) NOT BETWEEN 1 AND 500
      OR length(btrim(coalesce(v_location->>'city',''))) NOT BETWEEN 1 AND 200
      OR length(btrim(coalesce(v_location->>'postal_code',''))) NOT BETWEEN 1 AND 20
      OR coalesce(v_location->>'country_code','') !~ '^[A-Z]{2}$'
      OR p_parameters->'location_declaration' IS DISTINCT FROM jsonb_build_object('city',v_location->>'city','address',v_location->>'address') THEN
      RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '22023'; END IF;
  ELSE RAISE EXCEPTION 'INVALID_LOCATION' USING ERRCODE = '22023'; END IF;
  -- Canonicalisation déterministe; les espaces internes de description sont conservés.
  v_business_hash := encode(sha256(convert_to(jsonb_build_object('service',p_parameters->>'service_slug',
    'description',btrim(p_parameters->>'description'),'location',v_location,'reservation',v_reservation_id,
    'desired_at',(p_parameters->>'desired_at')::timestamptz)::text,'UTF8')),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended('provider-solicitation-business:' || p_actor_id::text || ':' || v_provider_id::text || ':' || v_business_hash,0));
  IF EXISTS (SELECT 1 FROM public.provider_solicitations WHERE owner_profile_id = p_actor_id AND provider_profile_id = v_provider_id
    AND business_fingerprint = v_business_hash AND status = 'sent') THEN
    RAISE EXCEPTION 'DUPLICATE_OPEN_SOLICITATION' USING ERRCODE = '23505'; END IF;
  INSERT INTO public.provider_solicitations(id,owner_profile_id,prospective_client_profile_id,provider_profile_id,
    service_slug,service_label_snapshot,description,location_kind,property_id,housing_id,reservation_id,
    location_label,city,postal_code,country_code,latitude,longitude,geocoded_at,geocoding_source,desired_at,
    creation_operation_id,business_fingerprint,created_at,updated_at)
  VALUES(v_id,p_actor_id,p_actor_id,v_provider_id,p_parameters->>'service_slug',p_parameters->>'service_label_snapshot',
    btrim(p_parameters->>'description'),v_location->>'kind',v_property_id,v_housing_id,v_reservation_id,
    p_parameters->>'location_label',p_parameters->>'city',p_parameters->>'postal_code',p_parameters->>'country_code',
    (p_parameters->>'latitude')::double precision,(p_parameters->>'longitude')::double precision,
    (p_parameters->>'geocoded_at')::timestamptz,p_parameters->>'geocoding_source',(p_parameters->>'desired_at')::timestamptz,
    v_operation_id,v_business_hash,v_now,v_now) RETURNING * INTO v_row;
  v_result := jsonb_build_object('solicitation_id',v_id,'status',v_row.status,'version',v_row.version);
  INSERT INTO public.provider_solicitation_operations(id,principal_profile_id,actor_profile_id,command,idempotency_key,
    request_fingerprint,solicitation_id,result) VALUES(v_operation_id,p_principal_id,p_actor_id,'create',p_idempotency_key,v_request_hash,v_id,v_result);
  INSERT INTO public.provider_solicitation_events(solicitation_id,event_type,actor_principal_id,actor_profile_id,
    old_status,new_status,version,operation_id) VALUES(v_id,'solicitation_sent',p_principal_id,p_actor_id,NULL,'sent',1,v_operation_id);
  RETURN jsonb_build_object('result',v_result,'operation_id',v_operation_id,'replayed',false);
END;
$function$;

CREATE FUNCTION public.respond_provider_solicitation(p_principal_id uuid,p_actor_id uuid,p_idempotency_key uuid,
  p_solicitation_id uuid,p_status text,p_message text,p_expected_version integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog SET timezone = 'UTC' AS $function$
DECLARE v_role text; v_row public.provider_solicitations%ROWTYPE; v_op public.provider_solicitation_operations%ROWTYPE;
  v_operation_id uuid := gen_random_uuid(); v_hash text; v_result jsonb; v_owner_id uuid; v_now timestamptz;
BEGIN
  IF p_idempotency_key IS NULL OR p_solicitation_id IS NULL OR p_status IS NULL OR p_status NOT IN ('interested','declined')
    OR p_expected_version IS NULL OR p_expected_version < 1 OR (p_message IS NOT NULL AND length(btrim(p_message)) NOT BETWEEN 1 AND 2000) THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023'; END IF;
  v_hash := encode(sha256(convert_to(jsonb_build_object('id',p_solicitation_id,'status',p_status,
    'message',btrim(p_message),'version',p_expected_version)::text,'UTF8')),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended('provider-solicitation-op:' || p_actor_id::text || ':' || p_idempotency_key::text,0));
  -- Lecture sans exposition, puis profils triés avant verrou de demande.
  SELECT owner_profile_id INTO v_owner_id FROM public.provider_solicitations WHERE id = p_solicitation_id;
  PERFORM id FROM public.profiles WHERE id IN (p_principal_id,p_actor_id,v_owner_id) ORDER BY id FOR SHARE;
  v_role := public.assert_provider_solicitation_actor(p_principal_id,p_actor_id);
  IF v_role NOT IN ('provider','provider_pro','artisan','artisan_pro') THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_row FROM public.provider_solicitations WHERE id = p_solicitation_id AND provider_profile_id = p_actor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  -- Le propriétaire doit rester actif, y compris pour un rejeu autorisé.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_owner_id AND status = 'active' AND lower(btrim(role)) IN ('owner','owner_pro')) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_op FROM public.provider_solicitation_operations WHERE principal_profile_id = p_principal_id
    AND actor_profile_id = p_actor_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_op.command <> 'respond' OR v_op.request_fingerprint <> v_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = '23505'; END IF;
    RETURN jsonb_build_object('result',v_op.result,'operation_id',v_op.id,'replayed',true);
  END IF;
  IF v_row.status <> 'sent' THEN RAISE EXCEPTION 'ALREADY_RESPONDED' USING ERRCODE = '55000'; END IF;
  IF v_row.version <> p_expected_version THEN RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE = '40001'; END IF;
  v_now := clock_timestamp();
  UPDATE public.provider_solicitations SET status = p_status,response_message = btrim(p_message),responded_at = v_now,
    updated_at = v_now,version = 2 WHERE id = p_solicitation_id RETURNING * INTO v_row;
  v_result := jsonb_build_object('solicitation_id',v_row.id,'status',v_row.status,'version',v_row.version);
  INSERT INTO public.provider_solicitation_operations(id,principal_profile_id,actor_profile_id,command,idempotency_key,
    request_fingerprint,solicitation_id,result) VALUES(v_operation_id,p_principal_id,p_actor_id,'respond',p_idempotency_key,v_hash,v_row.id,v_result);
  INSERT INTO public.provider_solicitation_events(solicitation_id,event_type,actor_principal_id,actor_profile_id,
    old_status,new_status,version,message,operation_id) VALUES(v_row.id,
    CASE p_status WHEN 'interested' THEN 'provider_interested' ELSE 'provider_declined' END,
    p_principal_id,p_actor_id,'sent',p_status,2,btrim(p_message),v_operation_id);
  RETURN jsonb_build_object('result',v_result,'operation_id',v_operation_id,'replayed',false);
END;
$function$;

CREATE FUNCTION public.read_provider_solicitations(p_principal_id uuid,p_actor_id uuid,p_solicitation_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,p_limit integer DEFAULT 20,p_before_at timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $function$
DECLARE v_role text; v_items jsonb; v_events jsonb; v_row public.provider_solicitations%ROWTYPE;
BEGIN
  v_role := public.assert_provider_solicitation_actor(p_principal_id,p_actor_id);
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR (p_status IS NOT NULL AND p_status NOT IN ('sent','interested','declined'))
    OR (p_before_at IS NULL) <> (p_before_id IS NULL) THEN RAISE EXCEPTION 'INVALID_INPUT' USING ERRCODE = '22023'; END IF;
  IF p_solicitation_id IS NOT NULL THEN
    SELECT * INTO v_row FROM public.provider_solicitations WHERE id = p_solicitation_id AND
      ((v_role IN ('owner','owner_pro') AND owner_profile_id = p_actor_id)
      OR (v_role IN ('provider','provider_pro','artisan','artisan_pro') AND provider_profile_id = p_actor_id));
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
    SELECT coalesce(jsonb_agg(to_jsonb(e) - ARRAY['actor_principal_id','operation_id'] ORDER BY e.version),'[]'::jsonb)
      INTO v_events FROM public.provider_solicitation_events e WHERE solicitation_id = v_row.id;
    v_items := to_jsonb(v_row) - ARRAY['creation_operation_id','business_fingerprint'];
    IF v_row.housing_id IS NOT NULL THEN v_items := jsonb_set(v_items,'{housing_id}',to_jsonb(v_row.housing_id::text)); END IF;
    IF v_role NOT IN ('owner','owner_pro') THEN v_items := v_items - ARRAY['property_id','housing_id','reservation_id']; END IF;
    RETURN jsonb_build_object('solicitation',v_items,'events',v_events);
  END IF;
  SELECT coalesce(jsonb_agg(q.item ORDER BY q.created_at DESC,q.id DESC),'[]'::jsonb) INTO v_items FROM (
    SELECT s.id,s.created_at,
      (CASE WHEN v_role IN ('owner','owner_pro') THEN
        (to_jsonb(s) || jsonb_build_object('housing_id',s.housing_id::text)) - ARRAY['creation_operation_id','business_fingerprint']
      ELSE to_jsonb(s) - ARRAY['creation_operation_id','business_fingerprint','property_id','housing_id','reservation_id'] END) AS item
    FROM public.provider_solicitations s WHERE
      ((v_role IN ('owner','owner_pro') AND s.owner_profile_id = p_actor_id)
      OR (v_role IN ('provider','provider_pro','artisan','artisan_pro') AND s.provider_profile_id = p_actor_id))
      AND (p_status IS NULL OR s.status = p_status)
      AND (p_before_at IS NULL OR (s.created_at,s.id) < (p_before_at,p_before_id))
    ORDER BY s.created_at DESC,s.id DESC LIMIT p_limit
  ) q;
  RETURN jsonb_build_object('items',v_items);
END;
$function$;

-- Refuser les ACL inattendues, y compris celles héritées des DEFAULT PRIVILEGES.
DO $permissions$
DECLARE v_proc record; v_table regclass;
BEGIN
  FOR v_proc IN SELECT p.oid,p.proname FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('guard_provider_solicitation_history','guard_provider_solicitation_transition',
      'is_provider_solicitation_service','check_provider_solicitation_audit','assert_provider_solicitation_actor','create_provider_solicitation','respond_provider_solicitation','read_provider_solicitations') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role',v_proc.oid::regprocedure);
    IF v_proc.proname IN ('create_provider_solicitation','respond_provider_solicitation','read_provider_solicitations') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',v_proc.oid::regprocedure);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_proc p CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      WHERE p.oid = v_proc.oid AND (p.proowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)
        OR (a.grantee <> p.proowner AND NOT (v_proc.proname IN ('create_provider_solicitation','respond_provider_solicitation','read_provider_solicitations')
          AND a.grantee = 'service_role'::regrole AND a.privilege_type = 'EXECUTE' AND NOT a.is_grantable)))) THEN
      RAISE EXCEPTION 'Unexpected solicitation function ACL' USING ERRCODE = '42501'; END IF;
  END LOOP;
  FOREACH v_table IN ARRAY ARRAY['public.provider_solicitations'::regclass,'public.provider_solicitation_operations'::regclass,
    'public.provider_solicitation_events'::regclass] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c CROSS JOIN LATERAL pg_catalog.aclexplode(coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) a
      WHERE c.oid = v_table AND (NOT c.relrowsecurity OR c.relowner <> (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user)
        OR a.grantee <> c.relowner)) THEN RAISE EXCEPTION 'Unexpected solicitation table ACL' USING ERRCODE = '42501'; END IF;
  END LOOP;
END;
$permissions$;

-- NON VALIDÉ sous PostgreSQL. Aucun accès client SQL autorisé n'est revendiqué.
-- Délai RPC à borner côté serveur; 40P01/40001: reprise de commande avec même clé.
-- Retour arrière avant trafic: transaction de migration; après trafic: désactiver
-- les futurs handlers et conserver données/historique, pas de DROP automatique.
COMMIT;
