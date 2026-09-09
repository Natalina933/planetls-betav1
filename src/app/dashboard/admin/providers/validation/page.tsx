"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiLoader, FiMapPin, FiSearch, FiShield, FiUser, FiXCircle } from "react-icons/fi";
import { ProviderDocumentReviewPanel } from "@/app/dashboard/admin/ProviderDocumentReviewPanel";
import styles from "@/app/dashboard/admin/AdminPeopleWorkspace.module.scss";

type ProviderProfileForValidation = {
  id: string;
  displayName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  service_area: string | null;
  service_radius_km: number | null;
  category: string | null;
  experience_level: string | null;
  years_experience: number | null;
  hourly_rate: number | null;
  created_at: string | null;
  updated_at: string | null;
  onboarding_complete: boolean;
  profile_completeness: number;
  pending_documents_count: number;
  verified_documents_count: number;
  has_insurance: boolean;
  has_identity: boolean;
  has_company: boolean;
};

type DensityByZone = {
  zone: string;
  count: number;
  verified: number;
  pending: number;
};

type ValidationFilter = "all" | "pending" | "partial" | "complete";

// Composant de visualisation de la densité par zone
function DensityVisualization({ densityByZone }: { densityByZone: DensityByZone[] }) {
  const totalArtisans = densityByZone.reduce((sum, zone) => sum + zone.count, 0);
  const totalPending = densityByZone.reduce((sum, zone) => sum + zone.pending, 0);
  const totalVerified = densityByZone.reduce((sum, zone) => sum + zone.verified, 0);

  return (
    <div className={styles.panel}>
      <header className={styles.densityHeader}>
        <h3>
          <FiMapPin />
          Densité locale des artisans
        </h3>
        <div className={styles.densitySummary}>
          <span className={styles.densityStat}>
            <strong>Total:</strong> {totalArtisans} artisans
          </span>
          <span className={styles.densityStat}>
            <strong>À valider:</strong> {totalPending} documents
          </span>
          <span className={styles.densityStat}>
            <strong>Validés:</strong> {totalVerified} documents
          </span>
        </div>
      </header>

      <div className={styles.densityTable}>
        <div className={styles.densityTableHeader}>
          <div>Zone / Ville</div>
          <div>Artisans</div>
          <div>Documents validés</div>
          <div>En attente</div>
          <div>Taux validation</div>
        </div>
        
        {densityByZone.map((zone) => {
          const validationRate = zone.count > 0 
            ? Math.round(((zone.verified) / (zone.verified + zone.pending)) * 100)
            : 0;
          const isHealthy = validationRate >= 80;
          const isWarning = validationRate >= 50 && validationRate < 80;
          
          return (
            <div key={zone.zone} className={styles.densityTableRow}>
              <div className={styles.zoneName}>
                <strong>{zone.zone}</strong>
              </div>
              <div className={styles.zoneCount}>
                {zone.count}
              </div>
              <div className={styles.zoneVerified}>
                {zone.verified}
              </div>
              <div className={styles.zonePending}>
                {zone.pending}
              </div>
              <div 
                className={`${styles.zoneRate} ${isHealthy ? styles.healthy : isWarning ? styles.warning : styles.critical}`}
              >
                {validationRate}%
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.densityNote}>
        💡 La densité locale est essentielle pour le bon fonctionnement de la mise en relation.
      </p>
    </div>
  );
}

// Composant de carte pour un artisan dans la liste
function ProviderValidationCard({
  provider,
  isSelected,
  onSelect,
}: {
  provider: ProviderProfileForValidation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardIdentity}>
          <h3>
            {provider.displayName}
            {provider.onboarding_complete && <span className={styles.completeBadge}>Profil complet</span>}
          </h3>
          <p className={styles.cardMeta}>
            {provider.companyName ? `Entreprise: ${provider.companyName}` : provider.category}
          </p>
        </div>
        <div className={styles.cardStatus}>
          <span className={styles.statusBadge} data-status={provider.onboarding_complete ? "verified" : "pending"}>
            {provider.onboarding_complete ? "Complet" : "En attente"}
          </span>
        </div>
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.cardDetail}>
          <span>📍 {provider.city ?? "Ville non renseignée"}</span>
          <span>🔧 {provider.category ?? "Métier non renseigné"}</span>
        </div>
        <div className={styles.cardDetail}>
          <span>📊 Complétude: {provider.profile_completeness}%</span>
          <span>
            Documents: {provider.verified_documents_count}✓ / {provider.pending_documents_count}⏳
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        {provider.has_insurance && <span className={styles.insuranceBadge}>Assuré</span>}
        {provider.has_identity && <span className={styles.identityBadge}>Identité vérifiée</span>}
        {provider.has_company && <span className={styles.companyBadge}>Entreprise vérifiée</span>}
        {!provider.has_insurance && !provider.has_identity && !provider.has_company && (
          <span className={styles.warningBadge}>Aucun document vérifié</span>
        )}
      </div>
    </article>
  );
}

// Composant de détail pour valider un artisan
// Pour l'instant, on utilise le panneau de documents existant directement
function ProviderValidationDetail({
  provider,
}: {
  provider: ProviderProfileForValidation;
}) {
  return (
    <div className={styles.detailPanel}>
      <header className={styles.detailHeader}>
        <h2>{provider.displayName}</h2>
        <p>{provider.companyName ?? provider.category}</p>
        <div className={styles.detailStats}>
          <span className={styles.statItem}>
            <strong>Complétude</strong> {provider.profile_completeness}%
          </span>
          <span className={styles.statItem}>
            <strong>Métier</strong> {provider.category ?? "Non renseigné"}
          </span>
          <span className={styles.statItem}>
            <strong>Ville</strong> {provider.city ?? "Non renseignée"}
          </span>
        </div>
      </header>

      <section className={styles.detailSection}>
        <h3>Informations professionnelles</h3>
        <div className={styles.infoGrid}>
          <div><strong>Email:</strong> {provider.email}</div>
          <div><strong>Téléphone:</strong> {provider.phone ?? "Non renseigné"}</div>
          <div><strong>Zone d'intervention:</strong> {provider.service_area ?? "Non renseignée"}</div>
          <div><strong>Rayon:</strong> {provider.service_radius_km ? `${provider.service_radius_km} km` : "Non renseigné"}</div>
          <div><strong>Expérience:</strong> {provider.years_experience ? `${provider.years_experience} ans` : "Non renseignée"}</div>
          <div><strong>Niveau:</strong> {provider.experience_level ?? "Non renseigné"}</div>
          <div><strong>Tarif horaire:</strong> {provider.hourly_rate ? `${provider.hourly_rate} €` : "Non renseigné"}</div>
        </div>
      </section>

      <section className={styles.detailSection}>
        <h3>
          <FiShield /> Justificatifs à valider ({provider.pending_documents_count})
        </h3>
        <ProviderDocumentReviewPanel providerId={provider.id} />
      </section>

      <section className={styles.detailSection}>
        <h3>Statut de validation</h3>
        <div className={styles.statusSummary}>
          <div className={styles.statusItem}>
            <span className={provider.has_insurance ? styles.valid : styles.pending}>
              {provider.has_insurance ? <FiCheckCircle /> : <FiClock />}
            </span>
            <span>Assurance {provider.has_insurance ? "validée" : "en attente"}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={provider.has_identity ? styles.valid : styles.pending}>
              {provider.has_identity ? <FiCheckCircle /> : <FiClock />}
            </span>
            <span>Identité {provider.has_identity ? "validée" : "en attente"}</span>
          </div>
          <div className={styles.statusItem}>
            <span className={provider.has_company ? styles.valid : styles.pending}>
              {provider.has_company ? <FiCheckCircle /> : <FiClock />}
            </span>
            <span>Entreprise {provider.has_company ? "validée" : "en attente"}</span>
          </div>
        </div>
        
        {provider.pending_documents_count === 0 && provider.verified_documents_count > 0 && (
          <div className={styles.successPanel}>
            <FiCheckCircle />
            <p>Tous les documents de cet artisan ont été validés.</p>
            <p>Son profil est maintenant visible dans les recherches et disponible pour les missions.</p>
          </div>
        )}
      </section>

      <div className={styles.detailActions}>
        <Link href={`/dashboard/admin/providers/${provider.id}`}>
          Voir le profil complet
        </Link>
      </div>
    </div>
  );
}

// Page principale
function ProviderValidationContent() {
  const [providers, setProviders] = useState<ProviderProfileForValidation[]>([]);
  const [densityByZone, setDensityByZone] = useState<DensityByZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ValidationFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showDensity, setShowDensity] = useState(false);

  const loadProviders = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        filter,
        search: searchQuery.trim(),
      });
      const response = await fetch(`/api/admin/providers/validation?${params.toString()}`, {
        cache: "no-store",
        signal,
      });
      
      if (!response.ok) {
        throw new Error("Impossible de charger les artisans à valider");
      }
      
      const payload = (await response.json()) as {
        providers?: ProviderProfileForValidation[];
        density_by_zone?: DensityByZone[];
        error?: string;
      };
      
      if (payload.error) {
        throw new Error(payload.error);
      }
      
      setProviders(payload.providers ?? []);
      setDensityByZone(payload.density_by_zone ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    void loadProviders(controller.signal);
    return () => controller.abort();
  }, [loadProviders]);

  const filteredProviders = providers.filter((provider) => {
    if (filter === "all") return true;
    if (filter === "pending") return provider.pending_documents_count > 0;
    if (filter === "partial") 
      return provider.pending_documents_count > 0 && provider.verified_documents_count > 0;
    if (filter === "complete") return provider.pending_documents_count === 0 && provider.verified_documents_count > 0;
    return true;
  });

  const stats = {
    total: providers.length,
    pending: providers.filter((p) => p.pending_documents_count > 0).length,
    partial: providers.filter((p) => p.pending_documents_count > 0 && p.verified_documents_count > 0).length,
    complete: providers.filter((p) => p.pending_documents_count === 0 && p.verified_documents_count > 0).length,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1>
              <FiShield />
              Validation des profils artisans
            </h1>
            <p>
              Validez les documents et informations des artisans pour les rendre visibles 
              dans les recherches et disponibles pour les missions.
            </p>
          </div>
        </div>

        <nav className={styles.headerNav}>
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={filter === "all" ? styles.activeTab : styles.tab}
              onClick={() => setFilter("all")}
            >
              <FiUser /> Tous ({stats.total})
            </button>
            <button
              type="button"
              className={filter === "pending" ? styles.activeTab : styles.tab}
              onClick={() => setFilter("pending")}
            >
              <FiClock /> En attente ({stats.pending})
            </button>
            <button
              type="button"
              className={filter === "partial" ? styles.activeTab : styles.tab}
              onClick={() => setFilter("partial")}
            >
              <FiAlertTriangle /> Partiel ({stats.partial})
            </button>
            <button
              type="button"
              className={filter === "complete" ? styles.activeTab : styles.tab}
              onClick={() => setFilter("complete")}
            >
              <FiCheckCircle /> Validés ({stats.complete})
            </button>
          </div>

          <button
            type="button"
            className={styles.densityToggle}
            onClick={() => setShowDensity(!showDensity)}
          >
            <FiMapPin />
            {showDensity ? "Masquer" : "Afficher"} la densité locale
          </button>

          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="search"
              placeholder="Rechercher par nom, ville ou métier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <FiXCircle />
              </button>
            )}
          </div>
        </nav>
      </header>

      {error ? (
        <div className={styles.errorPanel}>
          <FiAlertTriangle />
          <p>{error}</p>
          <button type="button" onClick={() => void loadProviders()}>
            Réessayer
          </button>
        </div>
      ) : null}

      {loading && providers.length === 0 ? (
        <div className={styles.loading}>
          <FiLoader className={styles.spinner} />
          <p>Chargement des artisans...</p>
        </div>
      ) : null}

      {!loading && filteredProviders.length === 0 ? (
        <div className={styles.emptyPanel}>
          <FiUser />
          <h3>Aucun artisan à valider</h3>
          <p>{filter === "all" 
            ? "Tous les profils artisans sont à jour." 
            : filter === "pending" 
              ? "Aucun artisan n'attend actuellement de validation."
              : filter === "partial" 
                ? "Aucun artisan avec validation partielle."
                : "Tous les artisans validés sont affichés."
          }</p>
        </div>
      ) : null}

      {/* Visualisation de la densité locale */}
      {showDensity && densityByZone.length > 0 && (
        <DensityVisualization densityByZone={densityByZone} />
      )}

      <div className={styles.grid}>
        <aside className={styles.leftColumn}>
          <div className={styles.listHeader}>
            <h2>Artisans à valider ({filteredProviders.length})</h2>
          </div>
          
          <div className={styles.list}>
            {filteredProviders.map((provider) => (
              <ProviderValidationCard
                key={provider.id}
                provider={provider}
                isSelected={selectedProvider === provider.id}
                onSelect={() => 
                  setSelectedProvider(
                    selectedProvider === provider.id ? null : provider.id
                  )
                }
              />
            ))}
          </div>
        </aside>

        <div className={styles.rightColumn}>
          {selectedProvider ? (
            <Suspense 
              fallback={<div className={styles.panel}><FiLoader className={styles.spinner} /><p>Chargement...</p></div>}
            >
              {(() => {
                const provider = providers.find(p => p.id === selectedProvider);
                return provider ? (
                  <ProviderValidationDetail provider={provider} />
                ) : null;
              })()}
            </Suspense>
          ) : (
            <div className={styles.panel}>
              <FiUser />
              <h3>Sélectionnez un artisan</h3>
              <p>Cliquez sur un artisan dans la liste pour voir ses documents et valider son profil.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.container}>
      <FiLoader className={styles.spinner} />
      <p>Chargement...</p>
    </div>
  );
}

export default function AdminProviderValidationPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ProviderValidationContent />
    </Suspense>
  );
}
