BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.workflow_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type VARCHAR(30),
  entity_id TEXT,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_notifications_recipient_created_at
  ON public.workflow_notifications(recipient_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_notifications_unread
  ON public.workflow_notifications(recipient_profile_id, read_at, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_provider_clients_provider_owner
  ON public.provider_clients(provider_profile_id, owner_profile_id);

CREATE OR REPLACE FUNCTION public.accept_quote_and_create_mission(
  p_quote_id UUID,
  p_actor_profile_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_request public.service_requests%ROWTYPE;
  v_existing_mission public.missions%ROWTYPE;
  v_created_mission public.missions%ROWTYPE;
  v_owner_profile RECORD;
  v_concierge_profile RECORD;
  v_client_id UUID;
  v_conversation_id UUID;
  v_now TIMESTAMPTZ := now();
  v_request_id UUID;
  v_property_id UUID;
  v_service_id BIGINT;
  v_title TEXT;
  v_description TEXT;
  v_priority VARCHAR(10) := 'normal';
  v_scheduled_start TIMESTAMPTZ;
  v_owner_name TEXT;
  v_quote_note TEXT;
BEGIN
  SELECT *
  INTO v_quote
  FROM public.quotes
  WHERE id = p_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND';
  END IF;

  IF v_quote.owner_profile_id IS NULL OR v_quote.concierge_profile_id IS NULL THEN
    RAISE EXCEPTION 'QUOTE_PARTICIPANTS_MISSING';
  END IF;

  IF v_quote.status NOT IN ('sent', 'accepted') THEN
    RAISE EXCEPTION 'QUOTE_STATUS_INVALID';
  END IF;

  SELECT
    id,
    first_name,
    last_name,
    username,
    company_name,
    email,
    phone,
    city,
    postal_code
  INTO v_owner_profile
  FROM public.profiles
  WHERE id = v_quote.owner_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OWNER_PROFILE_NOT_FOUND';
  END IF;

  SELECT
    id,
    first_name,
    last_name,
    username,
    company_name
  INTO v_concierge_profile
  FROM public.profiles
  WHERE id = v_quote.concierge_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONCIERGE_PROFILE_NOT_FOUND';
  END IF;

  IF v_quote.metadata ? 'service_request_id' THEN
    BEGIN
      v_request_id := (v_quote.metadata ->> 'service_request_id')::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_request_id := NULL;
    END;
  END IF;

  IF v_quote.metadata ? 'property_id' THEN
    BEGIN
      v_property_id := (v_quote.metadata ->> 'property_id')::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_property_id := NULL;
    END;
  END IF;

  IF v_quote.mission_id IS NOT NULL THEN
    SELECT *
    INTO v_existing_mission
    FROM public.missions
    WHERE id = v_quote.mission_id
    FOR UPDATE;
  END IF;

  IF v_request_id IS NOT NULL THEN
    SELECT *
    INTO v_request
    FROM public.service_requests
    WHERE id = v_request_id
    FOR UPDATE;
  END IF;

  SELECT qi.service_id
  INTO v_service_id
  FROM public.quote_items qi
  WHERE qi.quote_id = v_quote.id
    AND qi.service_id IS NOT NULL
  ORDER BY qi.sort_order ASC, qi.created_at ASC
  LIMIT 1;

  IF v_service_id IS NULL AND v_quote.metadata ? 'service_id' THEN
    BEGIN
      v_service_id := (v_quote.metadata ->> 'service_id')::BIGINT;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_service_id := NULL;
    END;
  END IF;

  v_title := COALESCE(
    NULLIF(BTRIM(v_request.title), ''),
    (
      SELECT NULLIF(BTRIM(qi.label), '')
      FROM public.quote_items qi
      WHERE qi.quote_id = v_quote.id
      ORDER BY qi.sort_order ASC, qi.created_at ASC
      LIMIT 1
    ),
    format('Mission issue du devis %s', COALESCE(v_quote.quote_number, v_quote.id::TEXT))
  );

  v_quote_note := NULLIF(BTRIM(v_quote.notes), '');
  v_description := COALESCE(
    NULLIF(BTRIM(v_request.description), ''),
    (
      SELECT NULLIF(BTRIM(qi.description), '')
      FROM public.quote_items qi
      WHERE qi.quote_id = v_quote.id
      ORDER BY qi.sort_order ASC, qi.created_at ASC
      LIMIT 1
    ),
    v_quote_note
  );

  IF v_request.id IS NOT NULL THEN
    v_property_id := COALESCE(v_request.property_id, v_property_id);
    v_scheduled_start := v_request.desired_date;
    IF v_request.urgency THEN
      v_priority := 'urgent';
    END IF;
  END IF;

  IF v_scheduled_start IS NULL THEN
    v_scheduled_start := date_trunc('day', now() + interval '1 day') + interval '9 hours';
  END IF;

  v_owner_name := COALESCE(
    NULLIF(BTRIM(CONCAT(COALESCE(v_owner_profile.first_name, ''), ' ', COALESCE(v_owner_profile.last_name, ''))), ''),
    NULLIF(BTRIM(v_owner_profile.company_name), ''),
    NULLIF(BTRIM(v_owner_profile.username), ''),
    'Proprietaire'
  );

  INSERT INTO public.provider_clients (
    provider_profile_id,
    owner_profile_id,
    client_name,
    company_name,
    email,
    phone,
    city,
    client_type,
    status,
    metadata
  )
  VALUES (
    v_quote.concierge_profile_id,
    v_quote.owner_profile_id,
    v_owner_name,
    NULLIF(BTRIM(v_owner_profile.company_name), ''),
    NULLIF(BTRIM(v_owner_profile.email), ''),
    NULLIF(BTRIM(v_owner_profile.phone), ''),
    NULLIF(BTRIM(v_owner_profile.city), ''),
    'owner',
    'active',
    jsonb_build_object(
      'origin', 'quote_acceptance',
      'quote_id', v_quote.id,
      'quote_number', v_quote.quote_number
    )
  )
  ON CONFLICT (provider_profile_id, owner_profile_id)
  DO UPDATE SET
    client_name = EXCLUDED.client_name,
    company_name = COALESCE(EXCLUDED.company_name, public.provider_clients.company_name),
    email = COALESCE(EXCLUDED.email, public.provider_clients.email),
    phone = COALESCE(EXCLUDED.phone, public.provider_clients.phone),
    city = COALESCE(EXCLUDED.city, public.provider_clients.city),
    status = 'active',
    metadata = public.provider_clients.metadata || EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_client_id;

  IF v_existing_mission.id IS NOT NULL THEN
    UPDATE public.missions
    SET
      owner_profile_id = COALESCE(public.missions.owner_profile_id, v_quote.owner_profile_id),
      property_id = COALESCE(public.missions.property_id, v_property_id),
      service_id = COALESCE(public.missions.service_id, v_service_id),
      title = COALESCE(NULLIF(public.missions.title, ''), v_title),
      description = COALESCE(public.missions.description, v_description),
      status = CASE
        WHEN public.missions.status IN ('completed', 'canceled') THEN public.missions.status
        ELSE 'accepted'
      END,
      priority = CASE
        WHEN public.missions.priority = 'urgent' THEN public.missions.priority
        ELSE v_priority
      END,
      amount = COALESCE(NULLIF(public.missions.amount, 0), v_quote.total_amount),
      currency = COALESCE(public.missions.currency, v_quote.currency, 'EUR'),
      scheduled_start = COALESCE(public.missions.scheduled_start, v_scheduled_start),
      scheduled_end = COALESCE(
        public.missions.scheduled_end,
        CASE
          WHEN v_scheduled_start IS NOT NULL THEN v_scheduled_start + interval '90 minutes'
          ELSE NULL
        END
      ),
      metadata = public.missions.metadata || jsonb_build_object(
        'source', 'quote_acceptance',
        'quote_id', v_quote.id,
        'quote_number', v_quote.quote_number,
        'client_id', v_client_id,
        'planning_auto_scheduled', true
      )
    WHERE id = v_existing_mission.id
    RETURNING * INTO v_created_mission;
  ELSE
    INSERT INTO public.missions (
      concierge_profile_id,
      owner_profile_id,
      property_id,
      service_id,
      title,
      description,
      status,
      priority,
      amount,
      currency,
      scheduled_start,
      scheduled_end,
      metadata
    )
    VALUES (
      v_quote.concierge_profile_id,
      v_quote.owner_profile_id,
      v_property_id,
      v_service_id,
      v_title,
      v_description,
      'accepted',
      v_priority,
      v_quote.total_amount,
      COALESCE(v_quote.currency, 'EUR'),
      v_scheduled_start,
      CASE
        WHEN v_scheduled_start IS NOT NULL THEN v_scheduled_start + interval '90 minutes'
        ELSE NULL
      END,
      jsonb_build_object(
        'source', 'quote_acceptance',
        'quote_id', v_quote.id,
        'quote_number', v_quote.quote_number,
        'service_request_id', v_request_id,
        'client_id', v_client_id,
        'planning_auto_scheduled', true
      )
    )
    RETURNING * INTO v_created_mission;

    INSERT INTO public.mission_events (
      mission_id,
      actor_profile_id,
      event_type,
      payload
    )
    VALUES (
      v_created_mission.id,
      p_actor_profile_id,
      'created',
      jsonb_build_object(
        'source', 'quote_acceptance',
        'quote_id', v_quote.id,
        'quote_number', v_quote.quote_number
      )
    );
  END IF;

  UPDATE public.quotes
  SET
    status = 'accepted',
    accepted_at = COALESCE(accepted_at, v_now),
    mission_id = v_created_mission.id,
    updated_at = v_now,
    metadata = public.quotes.metadata || jsonb_build_object(
      'workflow_completed_at', v_now,
      'client_id', v_client_id
    )
  WHERE id = v_quote.id;

  INSERT INTO public.quote_events (
    quote_id,
    actor_profile_id,
    event_type,
    payload
  )
  VALUES (
    v_quote.id,
    p_actor_profile_id,
    'accepted',
    jsonb_build_object(
      'from', v_quote.status,
      'to', 'accepted',
      'mission_id', v_created_mission.id,
      'client_id', v_client_id
    )
  );

  IF v_request.id IS NOT NULL THEN
    UPDATE public.service_requests
    SET
      status = 'accepted',
      selected_concierge_profile_id = v_quote.concierge_profile_id,
      updated_at = now(),
      metadata = public.service_requests.metadata || jsonb_build_object(
        'accepted_quote_id', v_quote.id,
        'accepted_mission_id', v_created_mission.id
      )
    WHERE id = v_request.id;

    UPDATE public.service_request_recipients
    SET
      status = CASE
        WHEN concierge_profile_id = v_quote.concierge_profile_id THEN 'selected'
        ELSE 'not_selected'
      END,
      responded_at = COALESCE(responded_at, v_now),
      updated_at = v_now,
      metadata = metadata || jsonb_build_object(
        'accepted_quote_id', v_quote.id,
        'accepted_mission_id', v_created_mission.id
      )
    WHERE service_request_id = v_request.id
      AND status <> 'declined';
  END IF;

  SELECT id
  INTO v_conversation_id
  FROM public.contact_conversations
  WHERE concierge_profile_id = v_quote.concierge_profile_id
    AND owner_profile_id = v_quote.owner_profile_id
    AND source = 'quote'
    AND COALESCE(source_reference, '') = v_quote.id::TEXT
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.contact_conversations (
      concierge_profile_id,
      owner_profile_id,
      source,
      source_reference,
      subject,
      metadata
    )
    VALUES (
      v_quote.concierge_profile_id,
      v_quote.owner_profile_id,
      'quote',
      v_quote.id::TEXT,
      format('Devis %s accepte', COALESCE(v_quote.quote_number, '')),
      jsonb_build_object(
        'quote_id', v_quote.id,
        'mission_id', v_created_mission.id,
        'client_id', v_client_id
      )
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    UPDATE public.contact_conversations
    SET
      subject = format('Devis %s accepte', COALESCE(v_quote.quote_number, '')),
      metadata = public.contact_conversations.metadata || jsonb_build_object(
        'quote_id', v_quote.id,
        'mission_id', v_created_mission.id,
        'client_id', v_client_id
      ),
      updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  INSERT INTO public.contact_messages (
    conversation_id,
    sender_profile_id,
    message_type,
    body,
    metadata
  )
  VALUES (
    v_conversation_id,
    p_actor_profile_id,
    'system',
    format(
      'Le devis %s a ete accepte. La mission "%s" a ete creee et le proprietaire a ete rattache a votre espace.',
      COALESCE(v_quote.quote_number, v_quote.id::TEXT),
      v_created_mission.title
    ),
    jsonb_build_object(
      'source', 'quote_acceptance',
      'quote_id', v_quote.id,
      'mission_id', v_created_mission.id,
      'client_id', v_client_id
    )
  );

  INSERT INTO public.workflow_notifications (
    recipient_profile_id,
    actor_profile_id,
    notification_type,
    title,
    body,
    entity_type,
    entity_id,
    action_url,
    metadata
  )
  VALUES
  (
    v_quote.owner_profile_id,
    p_actor_profile_id,
    'quote_accepted_confirmation',
    format('Devis %s accepte', COALESCE(v_quote.quote_number, '')),
    format('Votre mission "%s" est creee et votre concierge a ete confirme.', v_created_mission.title),
    'mission',
    v_created_mission.id::TEXT,
    '/dashboard/owner/conciergerie',
    jsonb_build_object('quote_id', v_quote.id, 'mission_id', v_created_mission.id)
  ),
  (
    v_quote.concierge_profile_id,
    p_actor_profile_id,
    'quote_accepted',
    format('Devis %s accepte', COALESCE(v_quote.quote_number, '')),
    format('Le proprietaire %s a accepte votre devis. La mission est prete.', v_owner_name),
    'mission',
    v_created_mission.id::TEXT,
    '/dashboard/concierge/contacts',
    jsonb_build_object('quote_id', v_quote.id, 'mission_id', v_created_mission.id, 'client_id', v_client_id)
  ),
  (
    v_quote.concierge_profile_id,
    p_actor_profile_id,
    'mission_created',
    format('Mission creee: %s', v_created_mission.title),
    'La mission issue du devis accepte est maintenant visible dans votre tableau de bord.',
    'mission',
    v_created_mission.id::TEXT,
    '/dashboard/concierge/missions/overview',
    jsonb_build_object('quote_id', v_quote.id, 'mission_id', v_created_mission.id)
  );

  RETURN jsonb_build_object(
    'quote_id', v_quote.id,
    'mission_id', v_created_mission.id,
    'client_id', v_client_id,
    'conversation_id', v_conversation_id,
    'service_request_id', v_request.id,
    'workflow_status', 'completed'
  );
END;
$$;

COMMIT;
