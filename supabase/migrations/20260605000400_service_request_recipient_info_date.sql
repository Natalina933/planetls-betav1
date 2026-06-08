-- Structured information request and proposed date on service request recipients
-- Date: 2026-06-05

BEGIN;

ALTER TABLE public.service_request_recipients
  ADD COLUMN IF NOT EXISTS proposed_date TIMESTAMPTZ;

DO $$
DECLARE
  status_type regtype;
  next_value text;
BEGIN
  SELECT attribute.atttypid::regtype
    INTO status_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.service_request_recipients'::regclass
    AND attribute.attname = 'status'
    AND attribute.attnum > 0
    AND NOT attribute.attisdropped;

  IF status_type IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_type WHERE oid = status_type::oid AND typtype = 'e')
  THEN
    FOREACH next_value IN ARRAY ARRAY[
      'information_requested',
      'date_proposed',
      'not_selected'
    ]
    LOOP
      EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', status_type, next_value);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.service_request_recipients
  DROP CONSTRAINT IF EXISTS service_request_recipients_status_check;

ALTER TABLE public.service_request_recipients
  ADD CONSTRAINT service_request_recipients_status_check
  CHECK (
    status::text IN (
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
