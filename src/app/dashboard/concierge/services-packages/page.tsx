"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Settings, Link as LinkIcon } from "lucide-react";
import { Tabs } from "@/app/components/ui/tabs";
import ServicePackageManager from "@/app/components/dashboard/concierge/ServicePackageManager/ServicePackageManager";
import ServiceCatalogManager from "@/app/components/dashboard/concierge/ServiceCatalogManager/ServiceCatalogManager";
import styles from "./_page.module.scss";

interface ServicePackage {
  id: string;
  name: string;
  category: string;
  service_ids: string[];
  description?: string;
}

export default function ServicesPackagesPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "packages" | "mappings">("packages");
  const [packages, setPackages] = useState<ServicePackage[]>([]);

  const handlePackCreated = (pkg: ServicePackage) => {
    setPackages((prev) => {
      if (prev.some((item) => item.id === pkg.id)) return prev;
      return [pkg, ...prev];
    });
  };

  const handlePacksLoaded = (next: ServicePackage[]) => {
    setPackages(next);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Gestion des Services et Packs</h1>
          <p>Organisez vos services proposes en packs professionnels, puis creez des tarifs et contrats.</p>
          <p style={{ marginTop: "0.5rem" }}>
            <Link href="/dashboard/concierge/services-packages/seed">Ouvrir la page seed test (2 packs + 2 modeles)</Link>
          </p>
        </div>
        <div className={styles.statsCards}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>PK</span>
            <div>
              <div className={styles.statNumber}>{packages.length}</div>
              <div className={styles.statLabel}>Packs crees</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>CFG</span>
            <div>
              <div className={styles.statNumber}>3</div>
              <div className={styles.statLabel}>Etapes</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.processFlow}>
        <div className={`${styles.step} ${activeTab === "catalog" ? styles.active : ""}`}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <h3>Services proposes</h3>
            <p>Selectionnez vos services</p>
          </div>
        </div>
        <div className={styles.arrow}>-</div>
        <div className={`${styles.step} ${activeTab === "packages" ? styles.active : ""}`}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <h3>Creer des packs</h3>
            <p>Groupez les services</p>
          </div>
        </div>
        <div className={styles.arrow}>-</div>
        <div className={`${styles.step} ${activeTab === "mappings" ? styles.active : ""}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <h3>Tarifs et contrats</h3>
            <p>Parametrez prix et modeles</p>
          </div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <Tabs
          defaultValue={activeTab}
          onValueChange={(v) => setActiveTab(v as "catalog" | "packages" | "mappings")}
          items={[
            {
              value: "catalog",
              label: "Mes Services",
              content: (
                <div className={styles.tabCard}>
                  <h2>Etape 1: Vos Services Proposes</h2>
                  <p>
                    Commencez par selectionner les services proposes. Seuls ces services
                    apparaitront dans les packs.
                  </p>
                  <ServiceCatalogManager />
                </div>
              ),
            },
            {
              value: "packages",
              label: "Mes Packs",
              content: (
                <div className={styles.tabCard}>
                  <h2>Etape 2: Creer des Packs de Services</h2>
                  <p>
                    Groupez vos services proposes en packages logiques.
                    Exemple: Pack Budget = Menage + Check-in + Linge.
                  </p>
                  <ServicePackageManager onPackCreated={handlePackCreated} onPacksLoaded={handlePacksLoaded} />
                </div>
              ),
            },
            {
              value: "mappings",
              label: "Tarifs et Contrats",
              content: (
                <div className={styles.tabCard}>
                  <h2>Etape 3: Lier Tarifs et Contrats</h2>
                  <p>
                    Creez des tarifs et modeles de contrats pour chaque pack.
                  </p>

                  {packages.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Package size={48} />
                      <h3>Aucun pack cree</h3>
                      <p>Allez a l&apos;etape 2 pour creer vos premiers packs.</p>
                      <button onClick={() => setActiveTab("packages")} className={styles.ctaButton}>
                        Creer un pack
                      </button>
                    </div>
                  ) : (
                    <div className={styles.packsMappings}>
                      <div className={styles.infoBanner}>
                        <Settings size={18} />
                        <div>
                          <strong>Prochaine etape:</strong>
                          <p>Cliquez sur &quot;Ajouter Tarif&quot; ou &quot;Ajouter Modele&quot; pour finaliser chaque pack.</p>
                        </div>
                      </div>

                      <div className={styles.packsList}>
                        {packages.map((pkg) => (
                          <div key={pkg.id} className={styles.packageCard}>
                            <div className={styles.packageHeader}>
                              <h4>{pkg.name}</h4>
                              <span className={styles.badge}>{pkg.category}</span>
                            </div>

                            <div className={styles.packageActions}>
                              <Link
                                className={styles.actionButton}
                                href={`/dashboard/concierge/pricing?packageId=${encodeURIComponent(pkg.id)}&packageName=${encodeURIComponent(pkg.name)}`}
                              >
                                <Settings size={16} />
                                Creer Tarif
                              </Link>
                              <Link
                                className={styles.actionButton}
                                href={`/dashboard/concierge/contract-templates?packageId=${encodeURIComponent(pkg.id)}&packageName=${encodeURIComponent(pkg.name)}`}
                              >
                                <LinkIcon size={16} />
                                Creer Contrat
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className={styles.footerInfo}>
        <div className={styles.infoCard}>
          <h3>Conseil Pro</h3>
          <p>Commencez avec 2 ou 3 packs principaux (Budget, Standard, Luxe).</p>
        </div>
        <div className={styles.infoCard}>
          <h3>Synchronisation</h3>
          <p>Quand un pack evolue, les futurs tarifs et contrats restent alignes.</p>
        </div>
        <div className={styles.infoCard}>
          <h3>Import/Export</h3>
          <p>Dupliquez rapidement un pack entre plusieurs proprietes.</p>
        </div>
      </div>
    </div>
  );
}
