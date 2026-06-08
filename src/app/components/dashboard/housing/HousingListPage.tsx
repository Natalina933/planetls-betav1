"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiMapPin, FiPlus, FiTarget, FiUsers } from "react-icons/fi";
import { DashboardSectionShell } from "@/components/dashboard";
import cardStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";
import profileStyles from "@/app/dashboard/concierge/profile/ConciergeProfilePage.module.scss";
import ownerHousingStyles from "./HousingListPage.module.scss";
import { EditableProfileSection } from "@/app/dashboard/concierge/profile/profileTabSections";

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
  statut: "pret" | "menage" | "arrivee" | "depart";
}

type HousingListPageProps = {
  title: string;
  addHref: string;
  detailHrefBase?: string;
  persona?: "owner" | "conciergerie";
};

function getSafePhoto(photo?: string) {
  return photo && photo.trim() !== "" ? photo : "/images/default-logement.png";
}

type PieStyle = CSSProperties & { "--value": string };

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function renderStatusLabel(statut: HousingListItem["statut"]) {
  if (statut === "pret") return "Prêt";
  if (statut === "menage") return "Ménage en cours";
  if (statut === "arrivee") return "Arrivée du jour";
  return "Départ du jour";
}

function getOccupancyLabel(capacite?: number) {
  if (!capacite || capacite <= 0) return "Capacité à définir";
  if (capacite === 1) return "1 voyageur";
  return `${capacite} voyageurs`;
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
  const firstEditableHousingHref =
    detailHrefBase && logements.length > 0 ? `${detailHrefBase}/${logements[0].id}` : addHref;
  const movementCount = stats.arrivees + stats.departs;
  const readinessRate =
    stats.total > 0 ? Math.round((stats.prets / Math.max(stats.total, 1)) * 100) : 0;

  const completedHousingCount = useMemo(
    () =>
      logements.filter((logement) => {
        const hasCapacity = Boolean(logement.infos?.capacite && logement.infos.capacite > 0);
        const hasEquipments = Boolean(logement.infos?.equipements?.length);
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
        detail: "Capacité/équipements",
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
      icon={<FiTarget />}
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
              <article key={card.label} className={ownerHousingStyles.summaryCard}>
                <div
                  className={ownerHousingStyles.summaryPie}
                  style={{ "--value": `${card.percent}%` } as PieStyle}
                  aria-hidden="true"
                >
                  <span className={ownerHousingStyles.summaryPieValue}>{card.percent}%</span>
                </div>
                <div className={ownerHousingStyles.summaryCopy}>
                  <span className={ownerHousingStyles.summaryLabel}>{card.label}</span>
                  <strong className={ownerHousingStyles.summaryValue}>{card.value}</strong>
                  <span className={ownerHousingStyles.summaryDetail}>{card.detail}</span>
                </div>
              </article>
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
                    <FiPlus /> Ajouter mon premier logement
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
                    <FiPlus /> Ajouter mon premier logement
                  </Link>
                </div>
              </section>
            )
          : null}

        {!loading && !error && logements.length > 0
          ? isConcierge
            ? renderConciergeEditableSection(
                "Tous les logements",
                firstEditableHousingHref,
                <div className={cardStyles.logementsGrid}>
                  {logements.map((logement) => {
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
                            <span className={cardStyles.metaItem}>
                              Type : {logement.infos?.categorie || "Appartement"}
                            </span>
                            <span className={cardStyles.metaItem}>Ville : {logement.ville}</span>
                            <span className={cardStyles.metaItem}>
                              Capacité : {logement.infos?.capacite ?? "-"} voyageur(s)
                            </span>
                            <span className={cardStyles.metaItem}>
                              Équipements :{" "}
                              {Array.isArray(logement.infos?.equipements) &&
                              logement.infos.equipements.length > 0
                                ? logement.infos.equipements.slice(0, 3).join(", ")
                                : "-"}
                            </span>
                          </p>

                          {logement.infos?.description ? (
                            <p className={cardStyles.cardDescription}>{logement.infos.description}</p>
                          ) : null}

                          <div className={cardStyles.cardFooter}>
                            <span className={`${cardStyles.status} ${cardStyles[`status-${logement.statut}`]}`}>
                              {renderStatusLabel(logement.statut)}
                            </span>
                            <span className={cardStyles.btnView}>{detailHrefBase ? "Voir" : "Logement"}</span>
                          </div>
                        </div>
                      </>
                    );

                    if (!detailHrefBase) {
                      return (
                        <div key={logement.id} className={cardStyles.logementCard}>
                          {cardContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={logement.id}
                        href={`${detailHrefBase}/${logement.id}`}
                        className={cardStyles.logementCard}
                      >
                        {cardContent}
                      </Link>
                    );
                  })}
                </div>,
              )
            : (
              <section className={pageStyles.panel}>
                <div className={pageStyles.sectionHeading}>
                  <div>
                    <h2 className={pageStyles.terracottaSectionTitle}>Logements</h2>
                  </div>
                  <div className={pageStyles.inlineActions}>
                    <Link href={addHref} className={pageStyles.buttonPrimary}>
                      <FiPlus /> Ajouter
                    </Link>
                  </div>
                </div>

                <div className={cardStyles.logementsGrid}>
                  {logements.map((logement) => {
                    const equipments = Array.isArray(logement.infos?.equipements)
                      ? logement.infos?.equipements.slice(0, 4)
                      : [];
                    const ownerCardClassName = `${cardStyles.logementCard} ${ownerHousingStyles.ownerCard}`;
                    const ownerStatusClassName = `${cardStyles.status} ${cardStyles[`status-${logement.statut}`]} ${ownerHousingStyles.ownerStatus}`;
                    const housingHref = detailHrefBase ? `${detailHrefBase}/${logement.id}` : "";
                    const cardContent = (
                      <>
                        <div
                          className={`${cardStyles.cardImageWrapper} ${ownerHousingStyles.ownerImageWrapper}`}
                        >
                          <Image
                            src={getSafePhoto(logement.photo_principale)}
                            alt={logement.nom_logement}
                            width={220}
                            height={180}
                            className={cardStyles.cardImage}
                          />
                          <div className={ownerHousingStyles.imageOverlay} />
                          <div className={ownerHousingStyles.imageTopline}>
                            <span className={ownerStatusClassName}>
                              {renderStatusLabel(logement.statut)}
                            </span>
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
                                {logement.infos?.categorie || "Appartement"}
                              </p>
                              <h2 className={cardStyles.cardTitle}>{logement.nom_logement}</h2>
                            </div>
                            <span className={ownerHousingStyles.capacityBadge}>
                              <FiUsers />
                              {getOccupancyLabel(logement.infos?.capacite)}
                            </span>
                          </div>

                          {logement.infos?.description ? (
                            <p className={`${cardStyles.cardDescription} ${ownerHousingStyles.ownerDescription}`}>
                              {logement.infos.description}
                            </p>
                          ) : null}

                          {equipments.length > 0 ? (
                            <div className={ownerHousingStyles.equipmentRow}>
                              {equipments.map((equipment) => (
                                <span
                                  key={`${logement.id}-${equipment}`}
                                  className={ownerHousingStyles.equipmentChip}
                                >
                                  {equipment}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className={`${cardStyles.cardFooter} ${ownerHousingStyles.ownerFooter}`}>
                            <span className={`${cardStyles.btnView} ${ownerHousingStyles.ownerViewButton}`}>
                              {detailHrefBase ? "Ouvrir" : "Logement"}
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
                      <Link key={logement.id} href={housingHref} className={ownerCardClassName}>
                        {cardContent}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )
          : null}
      </div>
    </DashboardSectionShell>
  );
}
