-- Contact conversations core model: threads + messages
-- Date: 2026-02-23

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.contact_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'search', 'mission', 'quote', 'invoice')),
  source_reference TEXT,
  subject TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'archived', 'closed')),
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.contact_conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'system')),
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_contact_conversations_pair_source_ref
  ON public.contact_conversations(concierge_profile_id, owner_profile_id, source, COALESCE(source_reference, ''));

CREATE INDEX IF NOT EXISTS idx_contact_conversations_concierge
  ON public.contact_conversations(concierge_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_conversations_owner
  ON public.contact_conversations(owner_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_conversations_last_message_at
  ON public.contact_conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_contact_messages_conversation
  ON public.contact_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_sender
  ON public.contact_messages(sender_profile_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_contact_conversations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_contact_conversations_updated_at ON public.contact_conversations;
CREATE TRIGGER trg_set_contact_conversations_updated_at
BEFORE UPDATE ON public.contact_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_contact_conversations_updated_at();

CREATE OR REPLACE FUNCTION public.sync_contact_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.contact_conversations
  SET
    last_message_preview = LEFT(NEW.body, 180),
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_contact_conversation_on_message ON public.contact_messages;
CREATE TRIGGER trg_sync_contact_conversation_on_message
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_contact_conversation_on_message();

COMMIT;
