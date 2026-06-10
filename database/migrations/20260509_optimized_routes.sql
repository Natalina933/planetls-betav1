-- Optimized concierge routes
-- Date: 2026-05-09

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.optimized_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route_date DATE NOT NULL,
  start_address TEXT,
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  end_address TEXT,
  end_latitude DOUBLE PRECISION,
  end_longitude DOUBLE PRECISION,
  total_distance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_travel_time INTEGER NOT NULL DEFAULT 0,
  total_mission_time INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'saved', 'completed', 'canceled')),
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.optimized_route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.optimized_routes(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  stop_order INTEGER NOT NULL,
  estimated_arrival_time TIMESTAMPTZ,
  estimated_departure_time TIMESTAMPTZ,
  travel_time_from_previous INTEGER NOT NULL DEFAULT 0,
  distance_from_previous NUMERIC(10, 2) NOT NULL DEFAULT 0,
  warning_message TEXT,
  mission_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_optimized_routes_concierge_profile_id
  ON public.optimized_routes(concierge_profile_id);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_route_date
  ON public.optimized_routes(route_date);
CREATE INDEX IF NOT EXISTS idx_optimized_route_stops_route_id
  ON public.optimized_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_optimized_route_stops_mission_id
  ON public.optimized_route_stops(mission_id);

CREATE OR REPLACE FUNCTION public.set_optimized_routes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_optimized_routes_updated_at ON public.optimized_routes;
CREATE TRIGGER trg_set_optimized_routes_updated_at
BEFORE UPDATE ON public.optimized_routes
FOR EACH ROW
EXECUTE FUNCTION public.set_optimized_routes_updated_at();

ALTER TABLE public.optimized_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimized_route_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS optimized_routes_select_own ON public.optimized_routes;
CREATE POLICY optimized_routes_select_own
  ON public.optimized_routes
  FOR SELECT
  USING (concierge_profile_id = auth.uid());

DROP POLICY IF EXISTS optimized_routes_insert_own ON public.optimized_routes;
CREATE POLICY optimized_routes_insert_own
  ON public.optimized_routes
  FOR INSERT
  WITH CHECK (concierge_profile_id = auth.uid());

DROP POLICY IF EXISTS optimized_routes_update_own ON public.optimized_routes;
CREATE POLICY optimized_routes_update_own
  ON public.optimized_routes
  FOR UPDATE
  USING (concierge_profile_id = auth.uid())
  WITH CHECK (concierge_profile_id = auth.uid());

DROP POLICY IF EXISTS optimized_routes_delete_own ON public.optimized_routes;
CREATE POLICY optimized_routes_delete_own
  ON public.optimized_routes
  FOR DELETE
  USING (concierge_profile_id = auth.uid());

DROP POLICY IF EXISTS optimized_route_stops_select_own_route ON public.optimized_route_stops;
CREATE POLICY optimized_route_stops_select_own_route
  ON public.optimized_route_stops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.optimized_routes routes
      WHERE routes.id = optimized_route_stops.route_id
        AND routes.concierge_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS optimized_route_stops_insert_own_route ON public.optimized_route_stops;
CREATE POLICY optimized_route_stops_insert_own_route
  ON public.optimized_route_stops
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.optimized_routes routes
      WHERE routes.id = optimized_route_stops.route_id
        AND routes.concierge_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS optimized_route_stops_update_own_route ON public.optimized_route_stops;
CREATE POLICY optimized_route_stops_update_own_route
  ON public.optimized_route_stops
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.optimized_routes routes
      WHERE routes.id = optimized_route_stops.route_id
        AND routes.concierge_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.optimized_routes routes
      WHERE routes.id = optimized_route_stops.route_id
        AND routes.concierge_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS optimized_route_stops_delete_own_route ON public.optimized_route_stops;
CREATE POLICY optimized_route_stops_delete_own_route
  ON public.optimized_route_stops
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.optimized_routes routes
      WHERE routes.id = optimized_route_stops.route_id
        AND routes.concierge_profile_id = auth.uid()
    )
  );

COMMIT;
