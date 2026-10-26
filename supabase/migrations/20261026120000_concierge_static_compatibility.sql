-- CONCIERGE-04A-1: prepared locally, NOT executed or PostgreSQL-validated.
-- Preflight: inspect pg_attribute/pg_constraint, save schema/data, test on fresh
-- and representative existing isolated databases. Unexpected schemas fail closed.
BEGIN;

-- Preserve every historical event; additions are emitted by the current routes.
ALTER TABLE public.mission_events DROP CONSTRAINT mission_events_event_type_check;
ALTER TABLE public.mission_events ADD CONSTRAINT mission_events_event_type_check
CHECK (event_type IN (
  'created', 'assigned', 'accepted', 'rejected', 'started', 'completed', 'canceled', 'updated',
  'quote_accepted', 'draft', 'to_schedule', 'date_requested', 'date_proposed',
  'date_confirmed', 'scheduled', 'awaiting_owner_validation', 'validated', 'closed',
  'closed_after_final_payment', 'invoice_paid', 'invoice_issued', 'invoice_canceled',
  'invoice_status_changed', 'reservation_step_created', 'reservation_move',
  'reservation_replan', 'reservation_assign', 'reservation_follow', 'reservation_delete',
  'traveler_stay_confirm_arrival_time', 'traveler_stay_mark_access_ready',
  'traveler_stay_mark_linen_ready', 'traveler_stay_mark_equipment_checked',
  'traveler_stay_mark_departure_ready', 'traveler_stay_override_preparation'
));

-- Widen only the three demonstrated VARCHAR columns, never shrink an existing
-- wider column. Enum/text installations retain their type and constraints.
DO $$
DECLARE
  target record;
  actual_type oid;
  actual_typmod integer;
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('service_requests', 21), ('service_request_recipients', 21), ('missions', 25)
  ) AS targets(table_name, required_length)
  LOOP
    SELECT a.atttypid, a.atttypmod INTO STRICT actual_type, actual_typmod
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', target.table_name)::regclass
      AND a.attname = 'status' AND a.attnum > 0 AND NOT a.attisdropped;
    IF actual_type = 'pg_catalog.varchar'::regtype THEN
      IF actual_typmod <> -1 AND actual_typmod - 4 < target.required_length THEN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN status TYPE varchar(%s)',
          target.table_name, target.required_length);
      END IF;
    ELSIF actual_type <> 'pg_catalog.text'::regtype
      AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_type WHERE oid = actual_type AND typtype = 'e') THEN
      RAISE EXCEPTION 'Unexpected status type for %', target.table_name;
    END IF;
  END LOOP;
END $$;
COMMIT;

-- Rollback requires separate review: narrowing is unsafe once long statuses
-- exist; restoring the old event CHECK is unsafe once new events exist.
-- Do not truncate data or delete events. Restore a backup or retain widening.
