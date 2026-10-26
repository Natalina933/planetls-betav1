-- Refuse duplicate data BEFORE attempting the proposed partial unique indexes.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.missions WHERE metadata->>'quote_operation_key' IS NOT NULL GROUP BY metadata->>'quote_operation_key' HAVING count(*)>1)
    OR EXISTS (SELECT 1 FROM public.missions WHERE metadata->>'stay_assignment_key' IS NOT NULL GROUP BY metadata->>'stay_assignment_key' HAVING count(*)>1)
    OR EXISTS (SELECT 1 FROM public.invoices WHERE quote_id IS NOT NULL AND metadata->>'source'='quote_acceptance' GROUP BY quote_id HAVING count(*)>1)
    OR EXISTS (SELECT 1 FROM public.invoice_items WHERE metadata->>'source_quote_item_id' IS NOT NULL GROUP BY invoice_id,metadata->>'source_quote_item_id' HAVING count(*)>1)
  THEN RAISE EXCEPTION 'Duplicate operational keys: manual review required, no automatic cleanup'; END IF;
  IF to_regclass('public.concierge_03b_quote_operation_unique') IS NOT NULL
    OR to_regclass('public.concierge_03b_stay_assignment_unique') IS NOT NULL
    OR to_regclass('public.concierge_03b_acceptance_invoice_unique') IS NOT NULL
    OR to_regclass('public.concierge_03b_invoice_source_line_unique') IS NOT NULL
  THEN RAISE EXCEPTION 'Unexpected pre-existing proposal indexes'; END IF;
END $$;
