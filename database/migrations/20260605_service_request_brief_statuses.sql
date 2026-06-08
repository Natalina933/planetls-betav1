-- Add brief-requested service request statuses
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_status_check;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_status_check
  CHECK (
    status IN (
      'draft',
      'sent',
      'received',
      'viewed',
      'in_review',
      'information_requested',
      'quoted',
      'quote_accepted',
      'quote_refused',
      'accepted',
      'closed',
      'cancelled',
      'expired'
    )
  );

COMMIT;
