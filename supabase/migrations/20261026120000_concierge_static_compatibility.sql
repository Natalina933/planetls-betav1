-- CONCIERGE-04A-1: prepared locally, NOT executed or PostgreSQL-validated.
-- Preflight: inspect pg_attribute/pg_constraint, save schema/data, test on fresh
-- and representative existing isolated databases. Unexpected schemas fail closed.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL search_path = pg_catalog, public;

-- Fixed order, before catalog snapshots or temporary trigger replacement.
-- No concurrent DML can observe a temporarily INSERT-only trigger.
LOCK TABLE public.mission_events, public.missions,
  public.service_request_recipients, public.service_requests
  IN ACCESS EXCLUSIVE MODE;

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
  relation_id oid;
  status_number smallint;
  expected_trigger text;
  expected_function oid;
  expected_columns text[];
  expected_attributes smallint[];
  saved_trigger pg_catalog.pg_trigger%ROWTYPE;
  saved_definition text;
  saved_comment text;
  saved_labels jsonb;
  saved_dependencies jsonb;
  restored_state jsonb;
  restored_comment text;
  restored_labels jsonb;
  restored_dependencies jsonb;
  blocker oid;
  dependency record;
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('service_requests', 21), ('service_request_recipients', 21), ('missions', 25)
  ) AS targets(table_name, required_length)
  LOOP
    relation_id := format('public.%I', target.table_name)::regclass;
    SELECT a.atttypid, a.atttypmod, a.attnum
      INTO STRICT actual_type, actual_typmod, status_number
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = relation_id
      AND a.attname = 'status' AND a.attnum > 0 AND NOT a.attisdropped;
    IF actual_type = 'pg_catalog.varchar'::regtype THEN
      IF actual_typmod <> -1 AND actual_typmod - 4 < target.required_length THEN
        -- This bounded repair supports ordinary historical tables only.
        IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class
          WHERE oid = relation_id AND relkind = 'r' AND NOT relispartition)
          OR EXISTS (SELECT 1 FROM pg_catalog.pg_inherits
            WHERE inhrelid = relation_id OR inhparent = relation_id) THEN
          RAISE EXCEPTION 'Unexpected table configuration for %', target.table_name;
        END IF;
        blocker := NULL;
        expected_trigger := CASE target.table_name
          WHEN 'service_requests' THEN 'trg_sync_service_request_workflow_status'
          WHEN 'missions' THEN 'trg_sync_mission_workflow_status'
          ELSE NULL END;
        expected_function := CASE target.table_name
          WHEN 'service_requests' THEN to_regprocedure('public.sync_service_request_workflow_status()')
          WHEN 'missions' THEN to_regprocedure('public.sync_mission_workflow_status()')
          ELSE NULL END;
        expected_columns := CASE target.table_name
          WHEN 'service_requests' THEN ARRAY['status', 'selected_concierge_profile_id', 'mission_id']
          WHEN 'missions' THEN ARRAY['status']
          ELSE ARRAY[]::text[] END;

        -- PostgreSQL rebuilds local constraints/indexes and handles the column's
        -- own default. Everything else requires explicit review, not deletion.
        FOR dependency IN SELECT d.* FROM pg_catalog.pg_depend d
          WHERE d.refclassid = 'pg_catalog.pg_class'::regclass
            AND d.refobjid = relation_id AND d.refobjsubid = status_number
        LOOP
          IF dependency.classid = 'pg_catalog.pg_trigger'::regclass THEN
            IF blocker IS NOT NULL OR expected_trigger IS NULL THEN
              RAISE EXCEPTION 'Unexpected trigger dependency for %', target.table_name;
            END IF;
            SELECT * INTO STRICT saved_trigger FROM pg_catalog.pg_trigger
              WHERE oid = dependency.objid;
            expected_attributes := ARRAY(
              SELECT a.attnum FROM unnest(expected_columns) WITH ORDINALITY AS c(name, position)
              JOIN pg_catalog.pg_attribute a ON a.attrelid = relation_id AND a.attname = c.name
                AND a.attnum > 0 AND NOT a.attisdropped ORDER BY c.position);
            IF saved_trigger.tgrelid <> relation_id
              OR saved_trigger.tgname <> expected_trigger
              OR expected_function IS NULL OR saved_trigger.tgfoid <> expected_function
              OR saved_trigger.tgtype <> 23 -- ROW | BEFORE | INSERT | UPDATE
              OR saved_trigger.tgisinternal OR saved_trigger.tgparentid <> 0
              OR saved_trigger.tgconstraint <> 0 OR saved_trigger.tgconstrrelid <> 0
              OR saved_trigger.tgconstrindid <> 0
              OR saved_trigger.tgdeferrable OR saved_trigger.tginitdeferred
              OR saved_trigger.tgqual IS NOT NULL OR saved_trigger.tgnargs <> 0
              OR saved_trigger.tgargs <> ''::bytea
              OR saved_trigger.tgoldtable IS NOT NULL OR saved_trigger.tgnewtable IS NOT NULL
              OR saved_trigger.tgenabled NOT IN ('O', 'D', 'R', 'A')
              OR cardinality(expected_attributes) <> cardinality(expected_columns)
              OR ARRAY(SELECT unnest(saved_trigger.tgattr)) <> expected_attributes
              OR dependency.deptype <> 'n'
              OR EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                WHERE d.classid = 'pg_catalog.pg_trigger'::regclass
                  AND d.objid = saved_trigger.oid AND d.deptype IN ('e', 'x', 'P', 'S')) THEN
              RAISE EXCEPTION 'Unexpected trigger configuration for %', target.table_name;
            END IF;
            blocker := saved_trigger.oid;
          ELSIF dependency.classid = 'pg_catalog.pg_constraint'::regclass
            AND EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
              WHERE oid = dependency.objid AND conrelid = relation_id) THEN
            NULL;
          ELSIF dependency.classid = 'pg_catalog.pg_class'::regclass
            AND EXISTS (SELECT 1 FROM pg_catalog.pg_index
              WHERE indexrelid = dependency.objid AND indrelid = relation_id) THEN
            NULL;
          ELSIF dependency.classid = 'pg_catalog.pg_attrdef'::regclass
            AND EXISTS (SELECT 1 FROM pg_catalog.pg_attrdef
              WHERE oid = dependency.objid AND adrelid = relation_id AND adnum = status_number) THEN
            NULL;
          ELSE
            RAISE EXCEPTION 'Unexpected status dependency for %: %', target.table_name,
              pg_describe_object(dependency.classid, dependency.objid, dependency.objsubid);
          END IF;
        END LOOP;

        IF blocker IS NOT NULL THEN
          saved_definition := pg_get_triggerdef(blocker, false);
          saved_comment := obj_description(blocker, 'pg_trigger');
          SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.provider), '[]'::jsonb)
            INTO saved_labels FROM pg_catalog.pg_seclabel s
            WHERE s.classoid = 'pg_catalog.pg_trigger'::regclass AND s.objoid = blocker;
          SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid, d.objid, d.objsubid,
            d.refclassid, d.refobjid, d.refobjsubid, d.deptype), '[]'::jsonb)
            INTO saved_dependencies FROM pg_catalog.pg_depend d
            WHERE d.classid = 'pg_catalog.pg_trigger'::regclass AND d.objid = blocker;
          IF saved_definition NOT LIKE 'CREATE TRIGGER %' THEN
            RAISE EXCEPTION 'Unexpected trigger definition for %', target.table_name;
          END IF;
          -- OR REPLACE retains the OID, comments and security labels. No DML
          -- occurs until the original UPDATE OF definition has been restored.
          EXECUTE format('CREATE OR REPLACE TRIGGER %I BEFORE INSERT ON public.%I '
            'FOR EACH ROW EXECUTE FUNCTION public.%I()', expected_trigger, target.table_name,
            CASE target.table_name WHEN 'service_requests' THEN 'sync_service_request_workflow_status'
              WHEN 'missions' THEN 'sync_mission_workflow_status' END);
        END IF;
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN status TYPE varchar(%s)',
          target.table_name, target.required_length);
        IF blocker IS NOT NULL THEN
          -- Replace only the validated leading command, not the captured body.
          EXECUTE 'CREATE OR REPLACE TRIGGER ' || substr(saved_definition, length('CREATE TRIGGER ') + 1);
          EXECUTE format('ALTER TABLE public.%I %s TRIGGER %I', target.table_name,
            CASE saved_trigger.tgenabled WHEN 'O' THEN 'ENABLE' WHEN 'D' THEN 'DISABLE'
              WHEN 'R' THEN 'ENABLE REPLICA' WHEN 'A' THEN 'ENABLE ALWAYS' END, expected_trigger);
          SELECT to_jsonb(t), obj_description(t.oid, 'pg_trigger')
            INTO STRICT restored_state, restored_comment FROM pg_catalog.pg_trigger t
            WHERE t.oid = blocker;
          SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.provider), '[]'::jsonb)
            INTO restored_labels FROM pg_catalog.pg_seclabel s
            WHERE s.classoid = 'pg_catalog.pg_trigger'::regclass AND s.objoid = blocker;
          SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.classid, d.objid, d.objsubid,
            d.refclassid, d.refobjid, d.refobjsubid, d.deptype), '[]'::jsonb)
            INTO restored_dependencies FROM pg_catalog.pg_depend d
            WHERE d.classid = 'pg_catalog.pg_trigger'::regclass AND d.objid = blocker;
          IF restored_state IS DISTINCT FROM to_jsonb(saved_trigger)
            OR pg_get_triggerdef(blocker, false) IS DISTINCT FROM saved_definition
            OR restored_comment IS DISTINCT FROM saved_comment
            OR restored_labels IS DISTINCT FROM saved_labels
            OR restored_dependencies IS DISTINCT FROM saved_dependencies THEN
            RAISE EXCEPTION 'Trigger restoration mismatch for %', target.table_name;
          END IF;
        END IF;
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
