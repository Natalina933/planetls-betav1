"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ServicePackageManager from "@/app/components/dashboard/concierge/ServicePackageManager/ServicePackageManager";
import OfferInfoCard from "@/app/components/dashboard/concierge/offers/OfferInfoCard";
import OfferMetricCard from "@/app/components/dashboard/concierge/offers/OfferMetricCard";
import {
  formatServicePackageMoney,
  type ContractTemplateRow,
  type PackageRow,
  type PricingPackageRow,
  type ServiceCatalogRow,
} from "@/types/servicePackages";
import { conciergeApiError } from "../conciergeFeedback";
import styles from "./page.module.scss";

export default function ServicesPackagesPage() {
  const [catalog, setCatalog] = useState<ServiceCatalogRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [pricingPackages, setPricingPackages] = useState<PricingPackageRow[]>([]);
  const [templates, setTemplates] = useState<ContractTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
        throw new Error(conciergeApiError("Impossible de charger le catalogue de services.", catalogPayload?.error));
      }
      if (!packagesResponse.ok) {
        throw new Error(conciergeApiError("Impossible de charger vos packs.", packagesPayload?.error));
      }
      if (!pricingResponse.ok) {
        throw new Error(conciergeApiError("Impossible de charger vos tarifs liés.", pricingPayload?.error));
      }
      if (!templatesResponse.ok) {
        throw new Error(conciergeApiError("Impossible de charger vos modèles de contrat.", templatesPayload?.error));
      }

      setCatalog(Array.isArray(catalogPayload) ? catalogPayload : []);
      setPackages(Array.isArray(packagesPayload) ? packagesPayload : []);
      setPricingPackages(Array.isArray(pricingPayload) ? pricingPayload : []);
      setTemplates(Array.isArray(templatesPayload) ? templatesPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : conciergeApiError("Impossible de charger vos packs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const serviceCount = catalog.length;
  const packageCount = packages.length;
  const pricingCount = pricingPackages.length;
  const templateCount = templates.length;

  const linkedServicesCount = useMemo(
    () =>
      packages.reduce(
        (total, pack) =>
          total + (Array.isArray(pack.services_package_items) ? pack.services_package_items.length : 0),
        0,
      ),
    [packages],
  );

  const averageServicesPerPack = useMemo(() => {
    if (packages.length === 0) return 0;
    return Math.round((linkedServicesCount / packages.length) * 10) / 10;
  }, [linkedServicesCount, packages.length]);

  const highlightedPack = useMemo(() => {
    if (packages.length === 0) return null;

    return [...packages]
      .sort((a, b) => {
        const aCount = a.services_package_items?.length ?? 0;
        const bCount = b.services_package_items?.length ?? 0;
        return bCount - aCount;
      })
      .at(0) ?? null;
  }, [packages]);

  const metrics = [
    {
      label: "Catalogue services",
      value: loading ? "..." : String(serviceCount),
      hint: "Services disponibles dans la base",
    },
    {
      label: "Packs actifs",
      value: loading ? "..." : String(packageCount),
      hint: "Offres prêtes à réutiliser",
    },
    {
      label: "Tarifs liés",
      value: loading ? "..." : String(pricingCount),
      hint: "Tarifs raccordés aux packs",
    },
    {
      label: "Modèles contrat",
      value: loading ? "..." : String(templateCount),
      hint: "Trames prêtes à signer",
    },
  ];

  return (
    <section className={`dashboard-grid ${styles.page}`} aria-busy={loading}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Offres et industrialisation</span>

        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <h1 className={styles.heroTitle}>Packs de services concierge</h1>
            <p className={styles.heroText}>
              Regroupez vos services en offres lisibles, puis rattachez tarifs et contrats.
            </p>
          </div>

          <div className={styles.heroActions}>
            <Link href="/dashboard/concierge/pricing" className={styles.heroLink}>
              Ouvrir la grille tarifaire
            </Link>
            <Link
              href="/dashboard/concierge/profile?tab=missions"
              className={styles.heroLink}
            >
              Voir Services & disponibilités
            </Link>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          {metrics.map((metric) => (
            <OfferMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
            />
          ))}
        </div>
      </div>

      {loading ? <p className={styles.feedbackBox} role="status">Chargement des packs...</p> : null}
      {error ? (
        <div className={styles.errorBox} role="alert">
          <span>{error}</span>
          <button type="button" className={styles.heroLink} onClick={() => void loadData()}>
            Réessayer
          </button>
        </div>
      ) : null}

      <div className={styles.workspace}>
        <section className={styles.workspaceMain}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrow}>Construction des offres</span>
            <h2 className={styles.sectionTitle}>Créer des packs clairs et réutilisables</h2>
            <p className={styles.sectionText}>
              Choisissez les services, nommez l&apos;offre, puis reliez les prix utiles.
            </p>
          </div>

          <ServicePackageManager />
        </section>

        <aside className={styles.workspaceAside}>
          <OfferInfoCard title="Lecture rapide">
            {highlightedPack ? (
              <>
                <p className={styles.copyLine}>
                  Pack le plus dense : <strong>{highlightedPack.name}</strong>
                </p>
                <p className={styles.copyLine}>
                  {(highlightedPack.services_package_items?.length ?? 0)} service(s) inclus
                </p>
              </>
            ) : (
              <p className={styles.copyLine}>
                Aucun pack créé pour le moment.
              </p>
            )}
            <p className={styles.copyLine}>
              Moyenne actuelle : <strong>{averageServicesPerPack}</strong> service(s) par pack
            </p>
          </OfferInfoCard>

          <OfferInfoCard title="Tarification">
            <p className={styles.copyLine}>
              {pricingCount > 0
                ? `${pricingCount} tarif(s) déjà relié(s) à vos packs.`
                : "Aucun tarif lié pour le moment."}
            </p>
            {pricingPackages.slice(0, 2).map((pricing) => (
              <p key={pricing.id} className={styles.copyLine}>
                {pricing.label} : <strong>{formatServicePackageMoney(pricing.amount)}</strong>
              </p>
            ))}
            <Link href="/dashboard/concierge/pricing" className={styles.heroLink}>
              Gérer les tarifs
            </Link>
          </OfferInfoCard>

        </aside>
      </div>
    </section>
  );
}
