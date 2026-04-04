-- Harden remaining public tables with RLS and participant-scoped policies
-- Date: 2026-04-04

BEGIN;

-- ---------------------------------------------------------------------------
-- Service catalog / packages
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.services_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_packages_select_own ON public.services_packages;
DROP POLICY IF EXISTS services_packages_insert_own ON public.services_packages;
DROP POLICY IF EXISTS services_packages_update_own ON public.services_packages;
DROP POLICY IF EXISTS services_packages_delete_own ON public.services_packages;

CREATE POLICY services_packages_select_own
  ON public.services_packages
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY services_packages_insert_own
  ON public.services_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY services_packages_update_own
  ON public.services_packages
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY services_packages_delete_own
  ON public.services_packages
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS services_package_items_select_own ON public.services_package_items;
DROP POLICY IF EXISTS services_package_items_insert_own ON public.services_package_items;
DROP POLICY IF EXISTS services_package_items_update_own ON public.services_package_items;
DROP POLICY IF EXISTS services_package_items_delete_own ON public.services_package_items;

CREATE POLICY services_package_items_select_own
  ON public.services_package_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.services_packages sp
      WHERE sp.id = services_package_items.package_id
        AND sp.profile_id = auth.uid()
    )
  );

CREATE POLICY services_package_items_insert_own
  ON public.services_package_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.services_packages sp
      WHERE sp.id = services_package_items.package_id
        AND sp.profile_id = auth.uid()
    )
  );

CREATE POLICY services_package_items_update_own
  ON public.services_package_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.services_packages sp
      WHERE sp.id = services_package_items.package_id
        AND sp.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.services_packages sp
      WHERE sp.id = services_package_items.package_id
        AND sp.profile_id = auth.uid()
    )
  );

CREATE POLICY services_package_items_delete_own
  ON public.services_package_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.services_packages sp
      WHERE sp.id = services_package_items.package_id
        AND sp.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pricing_packages_select_own ON public.pricing_packages;
DROP POLICY IF EXISTS pricing_packages_insert_own ON public.pricing_packages;
DROP POLICY IF EXISTS pricing_packages_update_own ON public.pricing_packages;
DROP POLICY IF EXISTS pricing_packages_delete_own ON public.pricing_packages;

CREATE POLICY pricing_packages_select_own
  ON public.pricing_packages
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY pricing_packages_insert_own
  ON public.pricing_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY pricing_packages_update_own
  ON public.pricing_packages
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY pricing_packages_delete_own
  ON public.pricing_packages
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS contract_templates_select_own ON public.contract_templates;
DROP POLICY IF EXISTS contract_templates_insert_own ON public.contract_templates;
DROP POLICY IF EXISTS contract_templates_update_own ON public.contract_templates;
DROP POLICY IF EXISTS contract_templates_delete_own ON public.contract_templates;

CREATE POLICY contract_templates_select_own
  ON public.contract_templates
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY contract_templates_insert_own
  ON public.contract_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY contract_templates_update_own
  ON public.contract_templates
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY contract_templates_delete_own
  ON public.contract_templates
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Contact conversations
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.contact_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_conversations_select_participants ON public.contact_conversations;
DROP POLICY IF EXISTS contact_conversations_insert_participants ON public.contact_conversations;
DROP POLICY IF EXISTS contact_conversations_update_participants ON public.contact_conversations;
DROP POLICY IF EXISTS contact_conversations_delete_participants ON public.contact_conversations;

CREATE POLICY contact_conversations_select_participants
  ON public.contact_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY contact_conversations_insert_participants
  ON public.contact_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY contact_conversations_update_participants
  ON public.contact_conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id)
  WITH CHECK (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY contact_conversations_delete_participants
  ON public.contact_conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

DROP POLICY IF EXISTS contact_messages_select_participants ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_insert_sender_participant ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_delete_sender_participant ON public.contact_messages;

CREATE POLICY contact_messages_select_participants
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.contact_conversations cc
      WHERE cc.id = contact_messages.conversation_id
        AND (auth.uid() = cc.concierge_profile_id OR auth.uid() = cc.owner_profile_id)
    )
  );

CREATE POLICY contact_messages_insert_sender_participant
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.contact_conversations cc
      WHERE cc.id = contact_messages.conversation_id
        AND (auth.uid() = cc.concierge_profile_id OR auth.uid() = cc.owner_profile_id)
    )
  );

CREATE POLICY contact_messages_delete_sender_participant
  ON public.contact_messages
  FOR DELETE
  TO authenticated
  USING (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.contact_conversations cc
      WHERE cc.id = contact_messages.conversation_id
        AND (auth.uid() = cc.concierge_profile_id OR auth.uid() = cc.owner_profile_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Quotes / invoices
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_select_participants ON public.quotes;
DROP POLICY IF EXISTS quotes_insert_concierge ON public.quotes;
DROP POLICY IF EXISTS quotes_update_participants ON public.quotes;
DROP POLICY IF EXISTS quotes_delete_concierge ON public.quotes;

CREATE POLICY quotes_select_participants
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY quotes_insert_concierge
  ON public.quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id);

CREATE POLICY quotes_update_participants
  ON public.quotes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id)
  WITH CHECK (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY quotes_delete_concierge
  ON public.quotes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS quote_items_select_participants ON public.quote_items;
DROP POLICY IF EXISTS quote_items_mutate_participants ON public.quote_items;

CREATE POLICY quote_items_select_participants
  ON public.quote_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND (auth.uid() = q.concierge_profile_id OR auth.uid() = q.owner_profile_id)
    )
  );

CREATE POLICY quote_items_mutate_participants
  ON public.quote_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND (auth.uid() = q.concierge_profile_id OR auth.uid() = q.owner_profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND (auth.uid() = q.concierge_profile_id OR auth.uid() = q.owner_profile_id)
    )
  );

DROP POLICY IF EXISTS quote_events_select_participants ON public.quote_events;
DROP POLICY IF EXISTS quote_events_insert_participants ON public.quote_events;

CREATE POLICY quote_events_select_participants
  ON public.quote_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_events.quote_id
        AND (auth.uid() = q.concierge_profile_id OR auth.uid() = q.owner_profile_id)
    )
  );

CREATE POLICY quote_events_insert_participants
  ON public.quote_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (actor_profile_id IS NULL OR actor_profile_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_events.quote_id
        AND (auth.uid() = q.concierge_profile_id OR auth.uid() = q.owner_profile_id)
    )
  );

DROP POLICY IF EXISTS invoices_select_participants ON public.invoices;
DROP POLICY IF EXISTS invoices_insert_concierge ON public.invoices;
DROP POLICY IF EXISTS invoices_update_participants ON public.invoices;
DROP POLICY IF EXISTS invoices_delete_concierge ON public.invoices;

CREATE POLICY invoices_select_participants
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY invoices_insert_concierge
  ON public.invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id);

CREATE POLICY invoices_update_participants
  ON public.invoices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id)
  WITH CHECK (auth.uid() = concierge_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY invoices_delete_concierge
  ON public.invoices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS invoice_items_select_participants ON public.invoice_items;
DROP POLICY IF EXISTS invoice_items_mutate_participants ON public.invoice_items;

CREATE POLICY invoice_items_select_participants
  ON public.invoice_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND (auth.uid() = i.concierge_profile_id OR auth.uid() = i.owner_profile_id)
    )
  );

CREATE POLICY invoice_items_mutate_participants
  ON public.invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND (auth.uid() = i.concierge_profile_id OR auth.uid() = i.owner_profile_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND (auth.uid() = i.concierge_profile_id OR auth.uid() = i.owner_profile_id)
    )
  );

DROP POLICY IF EXISTS invoice_events_select_participants ON public.invoice_events;
DROP POLICY IF EXISTS invoice_events_insert_participants ON public.invoice_events;

CREATE POLICY invoice_events_select_participants
  ON public.invoice_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_events.invoice_id
        AND (auth.uid() = i.concierge_profile_id OR auth.uid() = i.owner_profile_id)
    )
  );

CREATE POLICY invoice_events_insert_participants
  ON public.invoice_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (actor_profile_id IS NULL OR actor_profile_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_events.invoice_id
        AND (auth.uid() = i.concierge_profile_id OR auth.uid() = i.owner_profile_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Service requests
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_request_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_requests_select_participants ON public.service_requests;
DROP POLICY IF EXISTS service_requests_insert_owner ON public.service_requests;
DROP POLICY IF EXISTS service_requests_update_participants ON public.service_requests;
DROP POLICY IF EXISTS service_requests_delete_owner ON public.service_requests;

CREATE POLICY service_requests_select_participants
  ON public.service_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_profile_id
    OR auth.uid() = selected_concierge_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.service_request_recipients srr
      WHERE srr.service_request_id = service_requests.id
        AND srr.concierge_profile_id = auth.uid()
    )
  );

CREATE POLICY service_requests_insert_owner
  ON public.service_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_profile_id);

CREATE POLICY service_requests_update_participants
  ON public.service_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_profile_id
    OR auth.uid() = selected_concierge_profile_id
  )
  WITH CHECK (
    auth.uid() = owner_profile_id
    OR auth.uid() = selected_concierge_profile_id
  );

CREATE POLICY service_requests_delete_owner
  ON public.service_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_profile_id);

DROP POLICY IF EXISTS service_request_recipients_select_participants ON public.service_request_recipients;
DROP POLICY IF EXISTS service_request_recipients_insert_owner ON public.service_request_recipients;
DROP POLICY IF EXISTS service_request_recipients_update_participants ON public.service_request_recipients;
DROP POLICY IF EXISTS service_request_recipients_delete_owner ON public.service_request_recipients;

CREATE POLICY service_request_recipients_select_participants
  ON public.service_request_recipients
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = concierge_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_recipients.service_request_id
        AND sr.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY service_request_recipients_insert_owner
  ON public.service_request_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_recipients.service_request_id
        AND sr.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY service_request_recipients_update_participants
  ON public.service_request_recipients
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = concierge_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_recipients.service_request_id
        AND sr.owner_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = concierge_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_recipients.service_request_id
        AND sr.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY service_request_recipients_delete_owner
  ON public.service_request_recipients
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests sr
      WHERE sr.id = service_request_recipients.service_request_id
        AND sr.owner_profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Owner invitations and links
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.owner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_concierge_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_invitation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS owner_invitations_select_participants ON public.owner_invitations;
DROP POLICY IF EXISTS owner_invitations_insert_concierge ON public.owner_invitations;
DROP POLICY IF EXISTS owner_invitations_update_participants ON public.owner_invitations;
DROP POLICY IF EXISTS owner_invitations_delete_concierge ON public.owner_invitations;

CREATE POLICY owner_invitations_select_participants
  ON public.owner_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = claimed_owner_profile_id);

CREATE POLICY owner_invitations_insert_concierge
  ON public.owner_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = concierge_profile_id);

CREATE POLICY owner_invitations_update_participants
  ON public.owner_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = concierge_profile_id OR auth.uid() = claimed_owner_profile_id)
  WITH CHECK (auth.uid() = concierge_profile_id OR auth.uid() = claimed_owner_profile_id);

CREATE POLICY owner_invitations_delete_concierge
  ON public.owner_invitations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS owner_concierge_links_select_participants ON public.owner_concierge_links;
DROP POLICY IF EXISTS owner_concierge_links_insert_participants ON public.owner_concierge_links;
DROP POLICY IF EXISTS owner_concierge_links_update_participants ON public.owner_concierge_links;
DROP POLICY IF EXISTS owner_concierge_links_delete_participants ON public.owner_concierge_links;

CREATE POLICY owner_concierge_links_select_participants
  ON public.owner_concierge_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

CREATE POLICY owner_concierge_links_insert_participants
  ON public.owner_concierge_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

CREATE POLICY owner_concierge_links_update_participants
  ON public.owner_concierge_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id)
  WITH CHECK (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

CREATE POLICY owner_concierge_links_delete_participants
  ON public.owner_concierge_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_profile_id OR auth.uid() = concierge_profile_id);

DROP POLICY IF EXISTS owner_invitation_events_select_participants ON public.owner_invitation_events;
DROP POLICY IF EXISTS owner_invitation_events_insert_participants ON public.owner_invitation_events;

CREATE POLICY owner_invitation_events_select_participants
  ON public.owner_invitation_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.owner_invitations oi
      WHERE oi.id = owner_invitation_events.invitation_id
        AND (auth.uid() = oi.concierge_profile_id OR auth.uid() = oi.claimed_owner_profile_id)
    )
  );

CREATE POLICY owner_invitation_events_insert_participants
  ON public.owner_invitation_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (actor_profile_id IS NULL OR actor_profile_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.owner_invitations oi
      WHERE oi.id = owner_invitation_events.invitation_id
        AND (auth.uid() = oi.concierge_profile_id OR auth.uid() = oi.claimed_owner_profile_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Provider workspace: add missing participant policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS provider_clients_select_own ON public.provider_clients;
DROP POLICY IF EXISTS provider_clients_insert_own ON public.provider_clients;
DROP POLICY IF EXISTS provider_clients_update_own ON public.provider_clients;
DROP POLICY IF EXISTS provider_clients_delete_own ON public.provider_clients;

CREATE POLICY provider_clients_select_own
  ON public.provider_clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY provider_clients_insert_own
  ON public.provider_clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_profile_id);

CREATE POLICY provider_clients_update_own
  ON public.provider_clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_profile_id OR auth.uid() = owner_profile_id)
  WITH CHECK (auth.uid() = provider_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY provider_clients_delete_own
  ON public.provider_clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_profile_id);

DROP POLICY IF EXISTS provider_interventions_select_participants ON public.provider_interventions;
DROP POLICY IF EXISTS provider_interventions_insert_provider ON public.provider_interventions;
DROP POLICY IF EXISTS provider_interventions_update_participants ON public.provider_interventions;
DROP POLICY IF EXISTS provider_interventions_delete_provider ON public.provider_interventions;

CREATE POLICY provider_interventions_select_participants
  ON public.provider_interventions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY provider_interventions_insert_provider
  ON public.provider_interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_profile_id);

CREATE POLICY provider_interventions_update_participants
  ON public.provider_interventions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_profile_id OR auth.uid() = owner_profile_id)
  WITH CHECK (auth.uid() = provider_profile_id OR auth.uid() = owner_profile_id);

CREATE POLICY provider_interventions_delete_provider
  ON public.provider_interventions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_profile_id);

DROP POLICY IF EXISTS provider_alerts_select_participants ON public.provider_alerts;
DROP POLICY IF EXISTS provider_alerts_insert_provider ON public.provider_alerts;
DROP POLICY IF EXISTS provider_alerts_update_participants ON public.provider_alerts;
DROP POLICY IF EXISTS provider_alerts_delete_provider ON public.provider_alerts;

CREATE POLICY provider_alerts_select_participants
  ON public.provider_alerts
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = provider_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.provider_interventions pi
      WHERE pi.id = provider_alerts.intervention_id
        AND pi.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY provider_alerts_insert_provider
  ON public.provider_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_profile_id);

CREATE POLICY provider_alerts_update_participants
  ON public.provider_alerts
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = provider_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.provider_interventions pi
      WHERE pi.id = provider_alerts.intervention_id
        AND pi.owner_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = provider_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.provider_interventions pi
      WHERE pi.id = provider_alerts.intervention_id
        AND pi.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY provider_alerts_delete_provider
  ON public.provider_alerts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_profile_id);

DROP POLICY IF EXISTS provider_conversations_select_participants ON public.provider_conversations;
DROP POLICY IF EXISTS provider_conversations_insert_provider ON public.provider_conversations;
DROP POLICY IF EXISTS provider_conversations_update_participants ON public.provider_conversations;
DROP POLICY IF EXISTS provider_conversations_delete_provider ON public.provider_conversations;

CREATE POLICY provider_conversations_select_participants
  ON public.provider_conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = provider_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.provider_clients pc
      WHERE pc.id = provider_conversations.client_id
        AND pc.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY provider_conversations_insert_provider
  ON public.provider_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_profile_id);

CREATE POLICY provider_conversations_update_participants
  ON public.provider_conversations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = provider_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.provider_clients pc
      WHERE pc.id = provider_conversations.client_id
        AND pc.owner_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = provider_profile_id
    OR EXISTS (
      SELECT 1
      FROM public.provider_clients pc
      WHERE pc.id = provider_conversations.client_id
        AND pc.owner_profile_id = auth.uid()
    )
  );

CREATE POLICY provider_conversations_delete_provider
  ON public.provider_conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_profile_id);

DROP POLICY IF EXISTS provider_messages_select_participants ON public.provider_messages;
DROP POLICY IF EXISTS provider_messages_insert_sender_participant ON public.provider_messages;
DROP POLICY IF EXISTS provider_messages_delete_sender_participant ON public.provider_messages;

CREATE POLICY provider_messages_select_participants
  ON public.provider_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.provider_conversations pc
      LEFT JOIN public.provider_clients pcl
        ON pcl.id = pc.client_id
      WHERE pc.id = provider_messages.conversation_id
        AND (
          auth.uid() = pc.provider_profile_id
          OR auth.uid() = pcl.owner_profile_id
        )
    )
  );

CREATE POLICY provider_messages_insert_sender_participant
  ON public.provider_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.provider_conversations pc
      LEFT JOIN public.provider_clients pcl
        ON pcl.id = pc.client_id
      WHERE pc.id = provider_messages.conversation_id
        AND (
          auth.uid() = pc.provider_profile_id
          OR auth.uid() = pcl.owner_profile_id
        )
    )
  );

CREATE POLICY provider_messages_delete_sender_participant
  ON public.provider_messages
  FOR DELETE
  TO authenticated
  USING (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.provider_conversations pc
      LEFT JOIN public.provider_clients pcl
        ON pcl.id = pc.client_id
      WHERE pc.id = provider_messages.conversation_id
        AND (
          auth.uid() = pc.provider_profile_id
          OR auth.uid() = pcl.owner_profile_id
        )
    )
  );

COMMIT;
