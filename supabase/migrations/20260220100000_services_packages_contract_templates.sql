-- Services -> Packs -> Tarifs -> Modeles de contrats
-- Date: 2026-02-20

BEGIN;

-- Extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Packs de services
CREATE TABLE IF NOT EXISTS public.services_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, name)
);

-- 2) Services contenus dans un pack
CREATE TABLE IF NOT EXISTS public.services_package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.services_packages(id) ON DELETE CASCADE,
  service_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(package_id, service_id)
);

-- 3) Tarifs relies aux packs
CREATE TABLE IF NOT EXISTS public.pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.services_packages(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('hourly', 'fixed', 'monthly', 'custom')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  property_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Modeles de contrats relies aux packs
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.services_packages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index de perfs
CREATE INDEX IF NOT EXISTS idx_services_packages_profile_id
  ON public.services_packages(profile_id);

CREATE INDEX IF NOT EXISTS idx_services_package_items_package_id
  ON public.services_package_items(package_id);

CREATE INDEX IF NOT EXISTS idx_pricing_packages_profile_id
  ON public.pricing_packages(profile_id);

CREATE INDEX IF NOT EXISTS idx_pricing_packages_package_id
  ON public.pricing_packages(package_id);

CREATE INDEX IF NOT EXISTS idx_contract_templates_profile_id
  ON public.contract_templates(profile_id);

CREATE INDEX IF NOT EXISTS idx_contract_templates_package_id
  ON public.contract_templates(package_id);

COMMIT;
