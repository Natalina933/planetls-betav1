"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiMapPin, FiTarget, FiUsers } from "react-icons/fi";
import { DashboardSectionShell, MetricDonut } from "@/components/dashboard";
import { DashboardHomeIcon, DashboardHousesIcon } from "@/components/ui/PublicIcon";
import cardStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";
import profileStyles from "@/app/dashboard/concierge/profile/ConciergeProfilePage.module.scss";
import { EditableProfileSection } from "@/app/dashboard/concierge/profile/profileTabSections";
import ownerHousingStyles from "./HousingListPage.module.scss";

export interface HousingListItem {
  id: number;
  nom_logement: string;
  ville: string;
  photo_principale?: string;
  infos?: {
    categorie?: string;
    capacite?: number;
    equipements?: string[];
    description?: string;
  };
  characteristics?: {
    propertyType?: string;
    guestCapacity?: number | null;
    capacite?: number | null;
    amenities?: string[];
    description?: string;
  };
  statut: "pret" | "menage" | "arrivee" | "depart" | "active" | "published" | "draft" | string;
}

type HousingReviewItem = {
  id: string;
  label: string;
  detail: string;
  hash: string;
};

type HousingListPageProps = {
  title: string;
  addHref: string;
  detailHrefBase?: string;
  persona?: "owner" | "conciergerie";
};

function getSafePhoto(photo?: string) {
  return photo && photo.trim() !== "" ? photo : "/images/default-logement.png";
}

function hasCustomPhoto(photo?: string) {
  return Boolean(photo && photo.trim() !== "" && !photo.includes("/images/default-logement.png"));
}

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function toPositiveNumber(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function getHousingCapacity(logement: HousingListItem) {
  return (
    toPositiveNumber(logement.characteristics?.guestCapacity) ??
    toPositiveNumber(logement.characteristics?.capacite) ??
    toPositiveNumber(logement.infos?.capacite)
  );
}

function getHousingCategory(logement: HousingListItem) {
  return logement.infos?.categorie || logement.characteristics?.propertyType || "Appartement";
}

function getHousingEquipments(logement: HousingListItem) {
  const legacyEquipments = Array.isArray(logement.infos?.equipements) ? logement.infos.equipements : [];
  const amenities = Array.isArray(logement.characteristics?.amenities) ? logement.characteristics.amenities : [];
  return legacyEquipments.length > 0 ? legacyEquipments : amenities;
}

function getHousingDescription(logement: HousingListItem) {
  return logement.infos?.description?.trim() || logement.characteristics?.description?.trim() || "";
}

function renderStatusLabel(statut: HousingListItem["statut"]) {
  if (statut === "pret") return "Prêt";
  if (statut === "active" || statut === "published") return "Actif";
  if (statut === "draft") return "Brouillon";
  if (statut === "menage") return "Ménage en cours";
  if (statut === "arrivee") return "Arrivée du jour";
  if (statut === "depart") return "Départ du jour";
  return "À revoir";
}

function getOccupancyLabel(capacite?: number) {
  if (!capacite || capacite <= 0) return "Capacité maximale à définir";
  if (capacite === 1) return "Capacité maximale · 1 personne";
  return `Capacité maximale · ${capacite} personnes`;
}

function getHousingReviewItems(logement: HousingListItem): HousingReviewItem[] {
  const items: HousingReviewItem[] = [];
  const equipments = getHousingEquipments(logement);
  const capacity = getHousingCapacity(logement);
  const description = getHousingDescription(logement);

  if (!logement.nom_logement?.trim()) {
    items.push({
      id: "name",
      label: "Nom du logement",
      detail: "Ajoutez un nom clair pour identifier la fiche.",
      hash: "?tab=infos#informations",
    });
  }

  if (!logement.ville?.trim()) {
    items.push({
      id: "city",
      label: "Ville",
      detail: "Renseignez la ville pour les missions et les recherches.",
      hash: "?tab=infos#informations",
    });
  }

  if (!hasCustomPhoto(logement.photo_principale)) {
    items.push({
      id: "photo",
      label: "Photo principale",
      detail: "Ajoutez une photo visible du logement.",
      hash: "?tab=synthese#photos",
    });
  }

  if (!capacity) {
    items.push({
      id: "capacity",
      label: "Capacité maximale",
      detail: "Indiquez le nombre maximal de personnes autorisées.",
      hash: "?tab=infos#informations",
    });
  }

  if (equipments.length === 0) {
    items.push({
      id: "equipments",
      label: "Équipements",
      detail: "Ajoutez les équipements importants du logement.",
      hash: "?tab=stocks#stocks",
    });
  }

  if (!description) {
    items.push({
      id: "description",
      label: "Description",
      detail: "Complétez une courte description utile au suivi.",
      hash: "?tab=infos#informations",
    });
  }

  if (logement.statut === "draft") {
    items.push({
      id: "status",
      label: "Publication",
      detail: "Finalisez la fiche pour la passer en logement actif.",
      hash: "?tab=infos#informations",
    });
  }

  return items;
}

function isHousingToReview(logement: HousingListItem) {
  return getHousingReviewItems(logement).length > 0;
}

export default function HousingListPage({
  title,
  addHref,
  detailHrefBase,
  persona = "owner",
}: HousingListPageProps) {
  const [logements, setLogements] = useState<HousingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState("");

  async function loadLogements() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/housing", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Impossible de charger les logements.");
      }

      setLogements(data);
    } catch (err) {
      setLogements([]);
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogements();
  }, []);

  useEffect(() => {
    const syncFilterFromUrl = () => {
      setOwnerFilter(new URLSearchParams(window.location.search).get("filter") ?? "");
    };

    syncFilterFromUrl();
    window.addEventListener("popstate", syncFilterFromUrl);
    return () => window.removeEventListener("popstate", syncFilterFromUrl);
  }, []);

  const stats = useMemo(
    () => ({
      total: logements.length,
      prets: logements.filter((logement) => logement.statut === "pret").length,
      menages: logements.filter((logement) => logement.statut === "menage").length,
      arrivees: logements.filter((logement) => logement.statut === "arrivee").length,
      departs: logements.filter((logement) => logement.statut === "depart").length,
    }),
    [logements],
  );

  const isConcierge = persona === "conciergerie";
  const reviewLogements = useMemo(() => logements.filter(isHousingToReview), [logements]);
  const isReviewMode = !isConcierge && ownerFilter === "review";
  const visibleLogements = isReviewMode ? reviewLogements : logements;
  const firstEditableHousingHref =
    detailHrefBase && visibleLogements.length > 0 ? `${detailHrefBase}/${visibleLogements[0].id}` : addHref;
  const firstReviewHref =
    detailHrefBase && reviewLogements.length > 0
      ? `${detailHrefBase}/${reviewLogements[0].id}${getHousingReviewItems(reviewLogements[0])[0]?.hash ?? ""}`
      : addHref;
  const movementCount = stats.arrivees + stats.departs;
  const readinessRate = stats.total > 0 ? Math.round((stats.prets / stats.total) * 100) : 0;

  const completedHousingCount = useMemo(
    () =>
      logements.filter((logement) => {
        const hasCapacity = Boolean(getHousingCapacity(logement));
        const hasEquipments = getHousingEquipments(logement).length > 0;
        return Boolean(logement.nom_logement && logement.ville && (hasCapacity || hasEquipments));
      }).length,
    [logements],
  );

  const summaryCards = useMemo(
    () => [
      {
        label: "Prêts",
        value: `${stats.prets}/${stats.total}`,
        detail: "Disponibles",
        percent: readinessRate,
      },
      {
        label: "À préparer",
        value: `${stats.menages}`,
        detail: "Ménage",
        percent: getPercent(stats.menages, stats.total),
      },
      {
        label: "Mouvements",
        value: `${movementCount}`,
        detail: "Arrivées/départs",
        percent: getPercent(movementCount, stats.total),
      },
      {
        label: "Infos clés",
        value: `${completedHousingCount}/${stats.total}`,
        detail: "Capacité maximale/équipements",
        percent: getPercent(completedHousingCount, stats.total),
      },
    ],
    [completedHousingCount, movementCount, readinessRate, stats.menages, stats.prets, stats.total],
  );

  const goToHref = (href: string) => () => {
    window.location.href = href;
  };

  const renderConciergeEditableSection = (sectionTitle: string, editHref: string, children: ReactNode) => (
    <EditableProfileSection
      styles={profileStyles}
      title={sectionTitle}
      icon={sectionTitle === "Tous les logements" ? <DashboardHousesIcon /> : <FiTarget />}
      canEdit
      collapsible={false}
      isOpen
      isEditing={false}
      isDirty={false}
      isLoading={false}
      onToggle={() => {}}
      onHeaderKeyDown={() => {}}
      onBeginEdit={goToHref(editHref)}
      onSave={() => {}}
      onCancel={() => {}}
    >
      {children}
    </EditableProfileSection>
  );

  const renderHousingCards = (cardClassName?: string) => (
    <div className={cardStyles.logementsGrid}>
      {logements.map((logement) => {
        const statusClassName = cardStyles[`status-${logement.statut}`] ?? "";
        const capacity = getHousingCapacity(logement);
        const equipments = getHousingEquipments(logement);
        const description = getHousingDescription(logement);
        const cardContent = (
          <>
            <div className={cardStyles.cardImageWrapper}>
              <Image
                src={getSafePhoto(logement.photo_principale)}
                alt={logement.nom_logement}
                width={220}
                height={180}
                className={cardStyles.cardImage}
              />
            </div>

            <div className={cardStyles.cardBody}>
              <h2 className={cardStyles.cardTitle}>{logement.nom_logement}</h2>
              <p className={cardStyles.cardMeta}>
                <span className={cardStyles.metaItem}>Type : {getHousingCategory(logement)}</span>
                <span className={cardStyles.metaItem}>Ville : {logement.ville}</span>
                <span className={cardStyles.metaItem}>
                  Capacité maximale : {capacity ?? "-"} personne(s)
                </span>
                <span className={cardStyles.metaItem}>
                  Équipements :{" "}
                  {equipments.length > 0
                    ? equipments.slice(0, 3).join(", ")
                    : "-"}
                </span>
              </p>

              {description ? (
                <p className={cardStyles.cardDescription}>{description}</p>
              ) : null}

              <div className={cardStyles.cardFooter}>
                <span className={`${cardStyles.status} ${statusClassName}`}>
                  {renderStatusLabel(logement.statut)}
                </span>
                <span className={cardStyles.btnView}>{detailHrefBase ? "Voir" : "Logement"}</span>
              </div>
            </div>
          </>
        );
        const fullClassName = [cardStyles.logementCard, cardClassName].filter(Boolean).join(" ");

        if (!detailHrefBase) {
          return (
            <div key={logement.id} className={fullClassName}>
              {cardContent}
            </div>
          );
        }

        return (
          <Link key={logement.id} href={`${detailHrefBase}/${logement.id}`} className={fullClassName}>
            {cardContent}
          </Link>
        );
      })}
    </div>
  );

  const renderOwnerHousingCards = () => (
    <div className={cardStyles.logementsGrid}>
      {visibleLogements.map((logement) => {
        const equipments = getHousingEquipments(logement).slice(0, 4);
        const capacity = getHousingCapacity(logement);
        const description = getHousingDescription(logement);
        const reviewItems = getHousingReviewItems(logement);
        const statusClassName = cardStyles[`status-${logement.statut}`] ?? "";
        const ownerCardClassName = `${cardStyles.logementCard} ${ownerHousingStyles.ownerCard}`;
        const ownerStatusClassName = `${cardStyles.status} ${statusClassName} ${ownerHousingStyles.ownerStatus}`;
        const cardContent = (
          <>
            <div className={`${cardStyles.cardImageWrapper} ${ownerHousingStyles.ownerImageWrapper}`}>
              <Image
                src={getSafePhoto(logement.photo_principale)}
                alt={logement.nom_logement}
                width={220}
                height={180}
                className={cardStyles.cardImage}
              />
              <div className={ownerHousingStyles.imageOverlay} />
              <div className={ownerHousingStyles.imageTopline}>
                <span className={ownerStatusClassName}>{renderStatusLabel(logement.statut)}</span>
                <span className={ownerHousingStyles.cityPill}>
                  <FiMapPin />
                  {logement.ville}
                </span>
              </div>
            </div>

            <div className={`${cardStyles.cardBody} ${ownerHousingStyles.ownerCardBody}`}>
              <div className={ownerHousingStyles.cardHeading}>
                <div>
                  <p className={ownerHousingStyles.cardEyebrow}>
                    {getHousingCategory(logement)}
                  </p>
                  <h2 className={cardStyles.cardTitle}>{logement.nom_logement}</h2>
                </div>
                <span className={ownerHousingStyles.capacityBadge}>
                  <FiUsers />
                  {getOccupancyLabel(capacity ?? undefined)}
                </span>
              </div>

              {description ? (
                <p className={`${cardStyles.cardDescription} ${ownerHousingStyles.ownerDescription}`}>
                  {description}
                </p>
              ) : null}

              {equipments.length > 0 ? (
                <div className={ownerHousingStyles.equipmentRow}>
                  {equipments.map((equipment) => (
                    <span key={`${logement.id}-${equipment}`} className={ownerHousingStyles.equipmentChip}>
                      {equipment}
                    </span>
                  ))}
                </div>
              ) : null}

              {reviewItems.length > 0 ? (
                <div className={ownerHousingStyles.reviewChecklist}>
                  <div className={ownerHousingStyles.reviewChecklistHeader}>
                    <span>
                      <FiAlertTriangle />
                    </span>
                    <div>
                      <strong>{reviewItems.length} point(s) à corriger</strong>
                      <p>Suivez les étapes dans l&apos;ordre pour finaliser la fiche.</p>
                    </div>
                  </div>
                  <ol className={ownerHousingStyles.reviewSteps}>
                    {reviewItems.slice(0, 4).map((item, index) => (
                      <li key={`${logement.id}-${item.id}`}>
                        <span className={ownerHousingStyles.reviewStepNumber}>{index + 1}</span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.detail}</p>
                        </div>
                        {detailHrefBase ? <span className={ownerHousingStyles.reviewStepLink}>Corriger</span> : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <div className={ownerHousingStyles.reviewReady}>
                  <FiCheckCircle />
                  <span>Fiche complète</span>
                </div>
              )}

              <div className={`${cardStyles.cardFooter} ${ownerHousingStyles.ownerFooter}`}>
                <span className={`${cardStyles.btnView} ${ownerHousingStyles.ownerViewButton}`}>
                  {reviewItems.length > 0 ? "Corriger maintenant" : detailHrefBase ? "Ouvrir" : "Logement"}
                </span>
              </div>
            </div>
          </>
        );

        if (!detailHrefBase) {
          return (
            <div key={logement.id} className={ownerCardClassName}>
              {cardContent}
            </div>
          );
        }

        return (
          <Link
            key={logement.id}
            href={`${detailHrefBase}/${logement.id}${reviewItems[0]?.hash ?? ""}`}
            className={ownerCardClassName}
          >
            {cardContent}
          </Link>
        );
      })}
    </div>
  );

  return (
    <DashboardSectionShell
      persona={persona}
      title={title}
      subtitle="Gérez vos biens et les fiches à compléter."
      actions={isConcierge ? [{ label: "Ajouter un logement", href: addHref }] : undefined}
    >
      <div className={pageStyles.dashboardFlow}>
        {!loading && !error && !isConcierge && logements.length > 0 ? (
          <section className={ownerHousingStyles.summaryGrid} aria-label="Synthèse des logements">
            {summaryCards.map((card) => (
              <MetricDonut
                key={card.label}
                label={card.label}
                value={card.value}
                detail={card.detail}
                percent={card.percent}
              />
            ))}
          </section>
        ) : null}

        {loading ? (
          <section className={pageStyles.panel}>
            <p className={pageStyles.meta}>Chargement des logements...</p>
          </section>
        ) : null}

        {!loading && error ? (
          <section className={pageStyles.panel}>
            <p className={`${pageStyles.message} ${pageStyles.messageError}`}>{error}</p>
          </section>
        ) : null}

        {!loading && !error && logements.length === 0
          ? isConcierge
            ? renderConciergeEditableSection(
                "Parc logements",
                addHref,
                <div className={cardStyles.conciergeEmptyBlock}>
                  <p className={cardStyles.conciergeEyebrow}>Aucun logement</p>
                  <h3 className={cardStyles.conciergeTitle}>Commencez votre parc</h3>
                  <p className={cardStyles.conciergeText}>
                    Aucun logement réel n&apos;est encore enregistré sur votre compte.
                  </p>
                  <Link href={addHref} className={cardStyles.conciergePrimaryAction}>
                    <DashboardHomeIcon /> Ajouter mon premier logement
                  </Link>
                </div>,
              )
            : (
              <section className={pageStyles.panel}>
                <div className={pageStyles.sectionHeading}>
                  <div>
                    <p className={pageStyles.eyebrow}>Aucun logement</p>
                    <h2 className={pageStyles.terracottaSectionTitle}>Commencez votre parc</h2>
                  </div>
                </div>
                <p className={pageStyles.meta}>
                  Aucun logement réel n&apos;est encore enregistré sur votre compte.
                </p>
                <div className={pageStyles.inlineActions}>
                  <Link href={addHref} className={pageStyles.buttonPrimary}>
                    <DashboardHomeIcon /> Ajouter mon premier logement
                  </Link>
                </div>
              </section>
            )
          : null}

        {!loading && !error && logements.length > 0
          ? isConcierge
            ? renderConciergeEditableSection("Tous les logements", firstEditableHousingHref, renderHousingCards())
            : (
              <section className={pageStyles.panel}>
                <div className={pageStyles.sectionHeading}>
                  <div>
                    <p className={pageStyles.eyebrow}>{isReviewMode ? "Correction guidée" : "Parc propriétaire"}</p>
                    <h2 className={pageStyles.terracottaSectionTitle}>
                      {isReviewMode ? "Logements à revoir" : "Logements"}
                    </h2>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Link
                      href="/dashboard/owner/logements"
                      className={isReviewMode ? ownerHousingStyles.filterButton : ownerHousingStyles.filterButtonActive}
                      onClick={() => setOwnerFilter("")}
                    >
                      Tous
                    </Link>
                    <Link
                      href="/dashboard/owner/logements?filter=review"
                      className={isReviewMode ? ownerHousingStyles.filterButtonActive : ownerHousingStyles.filterButton}
                      onClick={() => setOwnerFilter("review")}
                    >
                      À revoir ({reviewLogements.length})
                    </Link>
                    <Link href={addHref} className={pageStyles.buttonPrimary}>
                      <DashboardHomeIcon /> Ajouter
                    </Link>
                  </div>
                </div>
                {reviewLogements.length > 0 ? (
                  <div className={ownerHousingStyles.reviewPanel}>
                    <span className={ownerHousingStyles.reviewPanelIcon}>
                      <FiAlertTriangle />
                    </span>
                    <div>
                      <strong>
                        {reviewLogements.length} logement{reviewLogements.length > 1 ? "s" : ""} à revoir
                      </strong>
                      <p>
                        Ouvrez le premier logement, complétez les points signalés, puis revenez ici pour vérifier que la
                        liste diminue.
                      </p>
                    </div>
                    <Link href={firstReviewHref} className={ownerHousingStyles.reviewPanelAction}>
                      Commencer
                    </Link>
                  </div>
                ) : (
                  <div className={ownerHousingStyles.reviewPanel} data-state="success">
                    <span className={ownerHousingStyles.reviewPanelIcon}>
                      <FiCheckCircle />
                    </span>
                    <div>
                      <strong>Aucun logement à revoir</strong>
                      <p>Toutes les fiches contrôlées disposent des informations essentielles.</p>
                    </div>
                  </div>
                )}
                {visibleLogements.length > 0 ? (
                  renderOwnerHousingCards()
                ) : (
                  <div className={ownerHousingStyles.reviewEmpty}>
                    <FiCheckCircle />
                    <strong>Aucune correction restante</strong>
                    <p>Vous pouvez revenir à la liste complète des logements.</p>
                    <Link href="/dashboard/owner/logements" className={ownerHousingStyles.reviewPanelAction}>
                      Voir tous les logements
                    </Link>
                  </div>
                )}
              </section>
            )
          : null}
      </div>
    </DashboardSectionShell>
  );
}
