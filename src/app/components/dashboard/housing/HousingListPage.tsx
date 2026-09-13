"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { toHousingPhotoUrl } from "@/app/lib/housingPhotoUrl";
import Link from "next/link";
import { FiMapPin, FiTarget, FiUsers } from "react-icons/fi";
import { DashboardSectionShell } from "@/components/dashboard";
import { DashboardHomeIcon, DashboardHousesIcon } from "@/components/ui/PublicIcon";
import cardStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";
import profileStyles from "@/app/dashboard/concierge/profile/ConciergeProfilePage.module.scss";
import { EditableProfileSection } from "@/app/dashboard/concierge/profile/profileTabSections";
import OwnerHousingOverview from "./OwnerHousingOverview";
import ownerHousingStyles from "./HousingListPage.module.scss";

export interface HousingListItem {
  id: number;
  nom_logement: string;
  ville: string;
  photo_principale?: string;
  proprietaire?: {
    manager_profile_id?: string | null;
    concierge_profile_id?: string | null;
  };
  infos?: {
    categorie?: string;
    capacite?: number;
    equipements?: string[];
    description?: string;
  };
  characteristics?: {
    propertyType?: string;
    bedroomCount?: number | null;
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


  const isConcierge = persona === "conciergerie";
  const reviewLogements = useMemo(() => logements.filter(isHousingToReview), [logements]);
  const isReviewMode = !isConcierge && ownerFilter === "review";
  const visibleLogements = isReviewMode ? reviewLogements : logements;
  const firstEditableHousingHref =
    detailHrefBase && visibleLogements.length > 0 ? `${detailHrefBase}/${visibleLogements[0].id}` : addHref;
  const firstReviewItem = reviewLogements.length > 0 ? getHousingReviewItems(reviewLogements[0])[0] : undefined;
  const firstReviewHref =
    detailHrefBase && reviewLogements.length > 0
      ? `${detailHrefBase}/${reviewLogements[0].id}${firstReviewItem?.hash ?? ""}`
      : addHref;
  const reviewPreview = firstReviewItem && reviewLogements.length > 0
    ? {
        housingName: reviewLogements[0].nom_logement,
        detail: `${firstReviewItem.label} · ${firstReviewItem.detail}`,
        href: firstReviewHref,
      }
    : null;

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
                src={toHousingPhotoUrl(getSafePhoto(logement.photo_principale), logement.id)} unoptimized
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

  const renderOwnerHousingCards = (
    items: HousingListItem[] = visibleLogements,
    nextStay: (id: number) => ReactNode = () => null,
    addCard?: ReactNode,
  ) => (
    <div className={cardStyles.logementsGrid}>
      {items.map((logement) => {
        const capacity = getHousingCapacity(logement);
        const bedrooms = toPositiveNumber(logement.characteristics?.bedroomCount);
        const equipment = getHousingEquipments(logement)[0];
        const reviewItems = getHousingReviewItems(logement);
        const cardContent = <>
          <div className={`${cardStyles.cardImageWrapper} ${ownerHousingStyles.ownerImageWrapper}`}>
            <Image src={toHousingPhotoUrl(getSafePhoto(logement.photo_principale), logement.id)} unoptimized alt={logement.nom_logement}
              width={640} height={340} sizes="(max-width: 700px) 100vw, (max-width: 1180px) 50vw, 33vw" className={cardStyles.cardImage} />
            <span className={`${cardStyles.status} ${cardStyles[`status-${logement.statut}`] ?? ""} ${ownerHousingStyles.ownerStatus}`}>
              {logement.statut === "draft" && reviewItems.length > 0 ? "Brouillon · À revoir" : renderStatusLabel(logement.statut)}
            </span>
          </div>
          <div className={`${cardStyles.cardBody} ${ownerHousingStyles.ownerCardBody}`}>
            <div className={ownerHousingStyles.cardHeading}>
              <h3>{logement.nom_logement}</h3>
              <p className={ownerHousingStyles.cardLocation}><FiMapPin aria-hidden="true" />{logement.ville || "Ville à renseigner"}</p>
            </div>
            <div className={ownerHousingStyles.cardFeatures}>
              <span><FiUsers aria-hidden="true" />{capacity ? `${capacity} personne${capacity > 1 ? "s" : ""}` : "Capacité à renseigner"}</span>
              {bedrooms ? <span>{bedrooms} chambre{bedrooms > 1 ? "s" : ""}</span> : null}
              {equipment ? <span>{equipment}</span> : null}
            </div>
            {nextStay(logement.id)}
            <div className={`${cardStyles.cardFooter} ${ownerHousingStyles.ownerFooter}`}>
              <span className={ownerHousingStyles.completionLabel}>{reviewItems.length ? "Fiche à compléter" : "Fiche complète"}</span>
              <span className={ownerHousingStyles.ownerViewButton}>{reviewItems.length ? "Corriger la fiche" : "Voir le logement"} <span aria-hidden="true">→</span></span>
            </div>
          </div>
        </>;
        const className = `${cardStyles.logementCard} ${ownerHousingStyles.ownerCard}`;
        return detailHrefBase
          ? <Link key={logement.id} href={`${detailHrefBase}/${logement.id}${reviewItems[0]?.hash ?? ""}`} className={className}>{cardContent}</Link>
          : <div key={logement.id} className={className}>{cardContent}</div>;
      })}
      {addCard}
    </div>
  );

  if (!isConcierge) return <OwnerHousingOverview
    logements={logements} visibleLogements={visibleLogements} total={logements.length} reviewCount={reviewLogements.length}
    reviewPreview={reviewPreview} loading={loading} error={error} onRetry={loadLogements}
    addHref={addHref} isReviewMode={isReviewMode}
    onFilter={setOwnerFilter} renderCards={renderOwnerHousingCards}
  />;

  return (
    <DashboardSectionShell persona={persona} title={title} subtitle="Gérez vos biens et les fiches à compléter." actions={[{label: "Ajouter un logement", href: addHref}]}>
      <div className={pageStyles.dashboardFlow}>
        {loading ? <section className={pageStyles.panel}><p className={pageStyles.meta}>Chargement des logements...</p></section> : error ? <section className={pageStyles.panel}><p className={`${pageStyles.message} ${pageStyles.messageError}`}>{error}</p></section> : logements.length === 0 ? renderConciergeEditableSection(
          "Parc logements", addHref,
          <div className={cardStyles.conciergeEmptyBlock}><p className={cardStyles.conciergeEyebrow}>Aucun logement</p><h3 className={cardStyles.conciergeTitle}>Commencez votre parc</h3><p className={cardStyles.conciergeText}>Aucun logement réel n&apos;est encore enregistré sur votre compte.</p><Link href={addHref} className={cardStyles.conciergePrimaryAction}><DashboardHomeIcon /> Ajouter mon premier logement</Link></div>
        ) : renderConciergeEditableSection("Tous les logements", firstEditableHousingHref, renderHousingCards())}
      </div>
    </DashboardSectionShell>
  );
}
