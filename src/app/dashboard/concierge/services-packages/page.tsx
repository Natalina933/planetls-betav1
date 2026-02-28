"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type ServiceCatalogRow = {
  id: string;
  category: string | null;
  service: string | null;
};

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  services_package_items?: Array<{ service_id: string }>;
};

type PricingPackageRow = {
  id: string;
  package_id: string;
  label: string;
  type: string;
  amount: number;
  property_type: string | null;
};

type ContractTemplateRow = {
  id: string;
  package_id: string;
  title: string;
};

function formatMoney(value: number) {
  return `${value.toFixed(0)} EUR`;
}

export default function ServicesPackagesPage() {
  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [pricingPackages, setPricingPackages] = useState<PricingPackageRow[]>([]);
  const [templates, setTemplates] = useState<ContractTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [catalogResponse, packagesResponse, pricingResponse, templatesResponse] =
          await Promise.all([
            fetch("/api/services/services-catalog", { cache: "no-store" }),
            fetch("/api/services/packages", { cache: "no-store" }),
            fetch("/api/services/pricing-packages", { cache: "no-store" }),
            fetch("/api/services/contract-templates", { cache: "no-store" }),
          ]);

        const catalogPayload = await catalogResponse.json();
        const packagesPayload = await packagesResponse.json();
        const pricingPayload = await pricingResponse.json();
        const templatesPayload = await templatesResponse.json();

        if (!catalogResponse.ok) {
          throw new Error(catalogPayload?.error || "Impossible de charger le catalogue de services.");
        }
        if (!packagesResponse.ok) {
          throw new Error(packagesPayload?.error || "Impossible de charger vos packs.");
        }
        if (!pricingResponse.ok) {
          throw new Error(pricingPayload?.error || "Impossible de charger vos tarifs lies.");
        }
        if (!templatesResponse.ok) {
          throw new Error(templatesPayload?.error || "Impossible de charger vos modèles de contrat.");
        }

        setCatalog(Array.isArray(catalogPayload) ? catalogPayload : []);
        setPackages(Array.isArray(packagesPayload) ? packagesPayload : []);
        setPricingPackages(Array.isArray(pricingPayload) ? pricingPayload : []);
        setTemplates(Array.isArray(templatesPayload) ? templatesPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos packs.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const serviceNameById = useMemo(() => {
    return new Map(
      catalog.map((service) => [service.id, service.service || service.category || "Service"]),
    );
  }, [catalog]);

  const cards = useMemo(() => {
    if (packages.length === 0) {
      return [
        {
          title: "Aucun pack créé pour le moment",
          text: loading
            ? "Chargement de vos packs en cours."
            : error ||
              "Vos packs de services, tarifs liés et modèles de contrat seront centralisés ici.",
          actions: [
            {
              label: "Configurer mes packs dans la fiche concierge",
              href: "/dashboard/concierge/profile?tab=packs",
              variant: "primary" as const,
            },
          ],
        },
      ];
    }

    return packages.map((pack) => {
      const linkedPricing = pricingPackages.filter((item) => item.package_id === pack.id);
      const linkedTemplates = templates.filter((item) => item.package_id === pack.id);
      const linkedServices =
        pack.services_package_items?.map((item) => serviceNameById.get(item.service_id) || "Service") || [];

      const pricingPreview =
        linkedPricing.length > 0
          ? linkedPricing
              .slice(0, 2)
              .map((item) => `${item.label}: ${formatMoney(item.amount)}`)
              .join(" | ")
          : "Aucun tarif lie";

      const templatesPreview =
        linkedTemplates.length > 0
          ? `${linkedTemplates.length} modele(s) de contrat`
          : "Aucun modele de contrat";

      return {
        title: pack.name,
        text: [
          pack.description || pack.category || "Pack sans description",
          linkedServices.length > 0 ? `Services: ${linkedServices.slice(0, 4).join(", ")}` : "Services non renseignes",
          pricingPreview,
          templatesPreview,
        ].join(" - "),
        actions: [
          {
            label: "Ouvrir dans la fiche",
            href: "/dashboard/concierge/profile?tab=packs",
            variant: "secondary" as const,
          },
          {
            label: "Lier un tarif",
            href: `/dashboard/concierge/pricing?packageId=${pack.id}&packageName=${encodeURIComponent(pack.name)}`,
            variant: "primary" as const,
          },
        ],
      };
    });
  }, [error, loading, packages, pricingPackages, serviceNameById, templates]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Offres et industrialisation"
      title="Packs de services concierge"
      description={
        loading
          ? "Chargement de vos packs de services..."
          : error ||
            "Centralisez vos offres commercialisables, les tarifs associés et les modèles de contrat pour standardiser vos signatures propriétaires."
      }
      chips={[
        `${packages.length} pack(s)`,
        `${pricingPackages.length} tarif(s) lié(s)`,
        `${templates.length} modèle(s)`,
      ]}
      actions={[
        { label: "Ouvrir ma fiche concierge", href: "/dashboard/concierge/profile?tab=packs" },
        { label: "Voir la grille tarifaire", href: "/dashboard/concierge/pricing" },
      ]}
      metrics={[
        {
          label: "Catalogue services",
          value: loading ? "..." : String(catalog.length),
          hint: "Services disponibles dans la base",
        },
        {
          label: "Packs actifs",
          value: loading ? "..." : String(packages.length),
          hint: "Offres structurées",
        },
        {
          label: "Modèles contrat",
          value: loading ? "..." : String(templates.length),
          hint: "Trames prêtes à signer",
        },
      ]}
      cards={cards}
    />
  );
}
