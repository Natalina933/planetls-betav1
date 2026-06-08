-- Structured information request and proposed date on service request recipients
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.service_request_recipients
  ADD COLUMN IF NOT EXISTS proposed_date TIMESTAMPTZ;

ALTER TABLE public.service_request_recipients
  DROP CONSTRAINT IF EXISTS service_request_recipients_status_check;

ALTER TABLE public.service_request_recipients
  ADD CONSTRAINT service_request_recipients_status_check
  CHECK (
    status IN (
      'sent',
      'viewed',
      'interested',
      'information_requested',
      'date_proposed',
      'quoted',
      'declined',
      'selected',
      'not_selected'
    )
  );

CREATE INDEX IF NOT EXISTS idx_service_request_recipients_proposed_date
  ON public.service_request_recipients(proposed_date);

COMMIT;
