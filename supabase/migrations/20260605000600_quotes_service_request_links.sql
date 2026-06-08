-- Link quotes to service requests and recipients
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS service_request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_request_recipient_id UUID REFERENCES public.service_request_recipients(id) ON DELETE SET NULL;

UPDATE public.quotes
SET
  service_request_id = CASE
    WHEN service_request_id IS NULL
      AND metadata ? 'service_request_id'
      AND (metadata->>'service_request_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN (metadata->>'service_request_id')::uuid
    ELSE service_request_id
  END,
  service_request_recipient_id = CASE
    WHEN service_request_recipient_id IS NULL
      AND metadata ? 'service_request_recipient_id'
      AND (metadata->>'service_request_recipient_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    THEN (metadata->>'service_request_recipient_id')::uuid
    ELSE service_request_recipient_id
  END
WHERE metadata ? 'service_request_id'
   OR metadata ? 'service_request_recipient_id';

CREATE INDEX IF NOT EXISTS idx_quotes_service_request_id
  ON public.quotes(service_request_id);

CREATE INDEX IF NOT EXISTS idx_quotes_service_request_recipient_id
  ON public.quotes(service_request_recipient_id);

CREATE INDEX IF NOT EXISTS idx_quotes_request_concierge_created_at
  ON public.quotes(service_request_id, concierge_profile_id, created_at DESC);

COMMIT;
