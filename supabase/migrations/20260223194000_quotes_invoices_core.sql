-- Quotes & Invoices core model: quotes, invoices, line items, events
-- Date: 2026-02-23

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE IF NOT EXISTS public.quote_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_seq bigint;
BEGIN
  next_seq := nextval('public.quote_number_seq');
  RETURN format('DV-%s-%06s', to_char(now(), 'YYYY'), next_seq);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_seq bigint;
BEGIN
  next_seq := nextval('public.invoice_number_seq');
  RETURN format('FA-%s-%06s', to_char(now(), 'YYYY'), next_seq);
END;
$$;

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE DEFAULT public.generate_quote_number(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.services_packages(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'canceled')),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  valid_until DATE,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES public.services_catalog(id) ON DELETE SET NULL,
  pricing_id UUID REFERENCES public.services_pricing(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(40) NOT NULL
    CHECK (event_type IN ('created', 'updated', 'sent', 'accepted', 'rejected', 'canceled', 'status_changed', 'deleted')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT public.generate_invoice_number(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'canceled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id BIGINT REFERENCES public.services_catalog(id) ON DELETE SET NULL,
  pricing_id UUID REFERENCES public.services_pricing(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(40) NOT NULL
    CHECK (event_type IN ('created', 'updated', 'issued', 'partially_paid', 'paid', 'overdue', 'canceled', 'status_changed', 'deleted')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_concierge_profile_id
  ON public.quotes(concierge_profile_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner_profile_id
  ON public.quotes(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status
  ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_mission_id
  ON public.quotes(mission_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at
  ON public.quotes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id
  ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_pricing_id
  ON public.quote_items(pricing_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_service_id
  ON public.quote_items(service_id);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id
  ON public.quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_created_at
  ON public.quote_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_concierge_profile_id
  ON public.invoices(concierge_profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_profile_id
  ON public.invoices(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date
  ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id
  ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at
  ON public.invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id
  ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_pricing_id
  ON public.invoice_items(pricing_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id
  ON public.invoice_items(service_id);

CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice_id
  ON public.invoice_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_created_at
  ON public.invoice_events(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_quotes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_quotes_updated_at ON public.quotes;
CREATE TRIGGER trg_set_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.set_quotes_updated_at();

CREATE OR REPLACE FUNCTION public.set_invoices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_set_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoices_updated_at();

CREATE OR REPLACE FUNCTION public.recompute_quote_totals(p_quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_tax_rate NUMERIC(5,2);
  v_tax_base NUMERIC(12,2);
  v_tax_amount NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0)::NUMERIC(12,2)
  INTO v_subtotal
  FROM public.quote_items
  WHERE quote_id = p_quote_id;

  SELECT COALESCE(discount_amount, 0), COALESCE(tax_rate, 0)
  INTO v_discount, v_tax_rate
  FROM public.quotes
  WHERE id = p_quote_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_tax_base := GREATEST(v_subtotal - v_discount, 0);
  v_tax_amount := ROUND((v_tax_base * v_tax_rate / 100.0)::NUMERIC, 2);

  UPDATE public.quotes
  SET
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = ROUND((v_tax_base + v_tax_amount)::NUMERIC, 2)
  WHERE id = p_quote_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_invoice_totals(p_invoice_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_tax_rate NUMERIC(5,2);
  v_paid_amount NUMERIC(12,2);
  v_tax_base NUMERIC(12,2);
  v_tax_amount NUMERIC(12,2);
  v_total NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0)::NUMERIC(12,2)
  INTO v_subtotal
  FROM public.invoice_items
  WHERE invoice_id = p_invoice_id;

  SELECT
    COALESCE(discount_amount, 0),
    COALESCE(tax_rate, 0),
    COALESCE(paid_amount, 0)
  INTO
    v_discount,
    v_tax_rate,
    v_paid_amount
  FROM public.invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_tax_base := GREATEST(v_subtotal - v_discount, 0);
  v_tax_amount := ROUND((v_tax_base * v_tax_rate / 100.0)::NUMERIC, 2);
  v_total := ROUND((v_tax_base + v_tax_amount)::NUMERIC, 2);

  UPDATE public.invoices
  SET
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_total,
    balance_amount = GREATEST(v_total - v_paid_amount, 0)
  WHERE id = p_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_quote_items_recompute_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_quote_totals(OLD.quote_id);
  ELSE
    PERFORM public.recompute_quote_totals(NEW.quote_id);
    IF TG_OP = 'UPDATE' AND OLD.quote_id IS DISTINCT FROM NEW.quote_id THEN
      PERFORM public.recompute_quote_totals(OLD.quote_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_items_recompute_totals ON public.quote_items;
CREATE TRIGGER trg_quote_items_recompute_totals
AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_quote_items_recompute_totals();

CREATE OR REPLACE FUNCTION public.trg_invoice_items_recompute_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_invoice_totals(OLD.invoice_id);
  ELSE
    PERFORM public.recompute_invoice_totals(NEW.invoice_id);
    IF TG_OP = 'UPDATE' AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id THEN
      PERFORM public.recompute_invoice_totals(OLD.invoice_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_items_recompute_totals ON public.invoice_items;
CREATE TRIGGER trg_invoice_items_recompute_totals
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_invoice_items_recompute_totals();

COMMIT;
