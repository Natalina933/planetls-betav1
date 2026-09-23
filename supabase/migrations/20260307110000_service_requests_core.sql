-- Service requests core model for owner -> concierge matching
-- Date: 2026-03-07

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NULL REFERENCES public.properties(id) ON DELETE SET NULL,
  selected_concierge_profile_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type VARCHAR(20) NOT NULL DEFAULT 'ponctuel'
    CHECK (request_type IN ('ponctuel', 'renfort', 'durable')),
  status VARCHAR(20) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'sent', 'in_review', 'quoted', 'accepted', 'closed', 'cancelled')),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  requested_services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  city TEXT,
  postal_code TEXT,
  desired_date TIMESTAMPTZ,
  urgency BOOLEAN NOT NULL DEFAULT false,
  budget_max NUMERIC(10, 2),
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_request_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'viewed', 'interested', 'quoted', 'declined', 'selected', 'not_selected')),
  response_message TEXT,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_service_request_recipient UNIQUE(service_request_id, concierge_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_service_requests_owner_created_at
  ON public.service_requests(owner_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_status
  ON public.service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_city
  ON public.service_requests(city);
CREATE INDEX IF NOT EXISTS idx_service_request_recipients_concierge
  ON public.service_request_recipients(concierge_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_recipients_status
  ON public.service_request_recipients(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_service_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER trg_set_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_service_requests_updated_at();

DROP TRIGGER IF EXISTS trg_set_service_request_recipients_updated_at ON public.service_request_recipients;
CREATE TRIGGER trg_set_service_request_recipients_updated_at
BEFORE UPDATE ON public.service_request_recipients
FOR EACH ROW
EXECUTE FUNCTION public.set_service_requests_updated_at();

COMMIT;
