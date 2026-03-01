-- Provider workspace core: clients, interventions, alerts
-- Date: 2026-03-01

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.provider_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  client_type VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (client_type IN ('manual', 'owner', 'business')),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.provider_clients(id) ON DELETE SET NULL,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  service_label TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  budget_amount NUMERIC(12,2),
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  location_label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES public.provider_interventions(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL DEFAULT 'general'
    CHECK (alert_type IN ('general', 'deadline', 'client', 'payment', 'quality')),
  severity VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (severity IN ('low', 'normal', 'high', 'urgent')),
  title TEXT NOT NULL,
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'read', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.provider_clients(id) ON DELETE SET NULL,
  subject TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'archived', 'closed')),
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.provider_conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_clients_provider
  ON public.provider_clients(provider_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_clients_owner
  ON public.provider_clients(owner_profile_id);

CREATE INDEX IF NOT EXISTS idx_provider_interventions_provider
  ON public.provider_interventions(provider_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_interventions_status
  ON public.provider_interventions(provider_profile_id, status, scheduled_start DESC);

CREATE INDEX IF NOT EXISTS idx_provider_interventions_client
  ON public.provider_interventions(client_id);

CREATE INDEX IF NOT EXISTS idx_provider_alerts_provider
  ON public.provider_alerts(provider_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_alerts_intervention
  ON public.provider_alerts(intervention_id);

CREATE INDEX IF NOT EXISTS idx_provider_conversations_provider
  ON public.provider_conversations(provider_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_conversations_client
  ON public.provider_conversations(client_id);

CREATE INDEX IF NOT EXISTS idx_provider_messages_conversation
  ON public.provider_messages(conversation_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.set_provider_workspace_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_provider_clients_updated_at ON public.provider_clients;
CREATE TRIGGER trg_set_provider_clients_updated_at
BEFORE UPDATE ON public.provider_clients
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_workspace_updated_at();

DROP TRIGGER IF EXISTS trg_set_provider_interventions_updated_at ON public.provider_interventions;
CREATE TRIGGER trg_set_provider_interventions_updated_at
BEFORE UPDATE ON public.provider_interventions
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_workspace_updated_at();

DROP TRIGGER IF EXISTS trg_set_provider_alerts_updated_at ON public.provider_alerts;
CREATE TRIGGER trg_set_provider_alerts_updated_at
BEFORE UPDATE ON public.provider_alerts
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_workspace_updated_at();

DROP TRIGGER IF EXISTS trg_set_provider_conversations_updated_at ON public.provider_conversations;
CREATE TRIGGER trg_set_provider_conversations_updated_at
BEFORE UPDATE ON public.provider_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_workspace_updated_at();

CREATE OR REPLACE FUNCTION public.sync_provider_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_conversations
  SET
    last_message_preview = LEFT(NEW.body, 180),
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_provider_conversation_on_message ON public.provider_messages;
CREATE TRIGGER trg_sync_provider_conversation_on_message
AFTER INSERT ON public.provider_messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_provider_conversation_on_message();

COMMIT;
