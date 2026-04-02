"use client";

import { useEffect, useMemo, useState } from "react";
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

function renderStatusLabel(statut: HousingListItem["statut"]) {
  if (statut === "pret") return "Pr\u00eat";
  if (statut === "menage") return "M\u00e9nage en cours";
  if (statut === "arrivee") return "Arriv\u00e9e du jour";
  return "D\u00e9part du jour";
}

function getOccupancyLabel(capacite?: number) {
  if (!capacite || capacite <= 0) return "Capacit\u00e9 \u00e0 d\u00e9finir";
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

  const goToHref = (href: string) => () => {
    window.location.href = href;
  };

  const renderConciergeEditableSection = (
    sectionTitle: string,
    editHref: string,
    children: React.ReactNode,
  ) => (
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
      subtitle="Visualisez l'\u00e9tat de vos logements, les mouvements et les fiches \u00e0 finaliser."
      stats={[
        { label: "Logements", value: `${stats.total}` },
        { label: "Pr\u00eats", value: `${stats.prets}` },
        { label: "M\u00e9nage", value: `${stats.menages}` },
        { label: "Mouvements", value: `${movementCount}` },
      ]}
      actions={[{ label: "Ajouter un logement", href: addHref }]}
    >
      <div className={pageStyles.dashboardFlow}>
        <section className={pageStyles.heroPanel}>
          <div className={pageStyles.sectionHeading}>
            <div>
              <p className={pageStyles.eyebrow}>Parc immobilier</p>
              <h1 className={pageStyles.terracottaTitle}>{title}</h1>
              <p className={pageStyles.meta}>
                Visualisez l&apos;\u00e9tat de vos logements et les fiches \u00e0 compl\u00e9ter en priorit\u00e9.
              </p>
            </div>
            <div className={pageStyles.inlineActions}>
              <Link href={addHref} className={pageStyles.buttonPrimary}>
                <FiPlus /> Ajouter un logement
              </Link>
            </div>
          </div>

          <div className={pageStyles.priorityGrid}>
            <article className={pageStyles.priorityCard}>
              <p className={pageStyles.cardLabel}>Logements</p>
              <strong className={pageStyles.cardValue}>{stats.total}</strong>
              <span className={pageStyles.meta}>Volume total de biens suivis.</span>
            </article>
            <article className={pageStyles.priorityCard}>
              <p className={pageStyles.cardLabel}>Pr\u00eats</p>
              <strong className={pageStyles.cardValue}>{stats.prets}</strong>
              <span className={pageStyles.meta}>Biens disponibles ou d\u00e9j\u00e0 pr\u00e9par\u00e9s.</span>
            </article>
            <article className={`${pageStyles.priorityCard} ${pageStyles.priorityWarning}`}>
              <p className={pageStyles.cardLabel}>Mouvements</p>
              <strong className={pageStyles.cardValue}>{movementCount}</strong>
              <span className={pageStyles.meta}>Arriv\u00e9es et d\u00e9parts \u00e0 absorber.</span>
            </article>
          </div>

          {!isConcierge ? (
            <div className={ownerHousingStyles.ownerHighlights}>
              <article className={ownerHousingStyles.highlightCard}>
                <span className={ownerHousingStyles.highlightLabel}>Taux de pr\u00e9paration</span>
                <strong className={ownerHousingStyles.highlightValue}>{readinessRate}%</strong>
                <p className={ownerHousingStyles.highlightText}>
                  Part des logements actuellement pr\u00eats \u00e0 accueillir un voyageur.
                </p>
              </article>
              <article className={ownerHousingStyles.highlightCard}>
                <span className={ownerHousingStyles.highlightLabel}>Attention terrain</span>
                <strong className={ownerHousingStyles.highlightValue}>{stats.menages}</strong>
                <p className={ownerHousingStyles.highlightText}>
                  Logement(s) en m\u00e9nage ou \u00e0 surveiller avant la prochaine rotation.
                </p>
              </article>
              <article className={ownerHousingStyles.highlightCard}>
                <span className={ownerHousingStyles.highlightLabel}>Flux du jour</span>
                <strong className={ownerHousingStyles.highlightValue}>{movementCount}</strong>
                <p className={ownerHousingStyles.highlightText}>
                  Arriv\u00e9es et d\u00e9parts qui demandent une coordination particuli\u00e8re.
                </p>
              </article>
            </div>
          ) : null}
        </section>

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
                    Aucun logement r\u00e9el n&apos;est encore enregistr\u00e9 sur votre compte.
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
                  Aucun logement r\u00e9el n&apos;est encore enregistr\u00e9 sur votre compte.
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
                              Capacit\u00e9 : {logement.infos?.capacite ?? "-"} voyageur(s)
                            </span>
                            <span className={cardStyles.metaItem}>
                              \u00c9quipements :{" "}
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
                            <span className={cardStyles.btnView}>{detailHrefBase ? "Voir ->" : "Logement"}</span>
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
                    <p className={pageStyles.eyebrow}>Vue cartes</p>
                    <h2 className={pageStyles.terracottaSectionTitle}>Tous les logements</h2>
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

                          <div className={ownerHousingStyles.factsGrid}>
                            <article className={ownerHousingStyles.factCard}>
                              <span>Ville</span>
                              <strong>{logement.ville}</strong>
                            </article>
                            <article className={ownerHousingStyles.factCard}>
                              <span>Capacit\u00e9</span>
                              <strong>{logement.infos?.capacite ?? "-"}</strong>
                            </article>
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
                            <div className={ownerHousingStyles.ownerFooterCopy}>
                              <span className={ownerHousingStyles.footerLabel}>Fiche logement</span>
                              <span className={ownerHousingStyles.footerHint}>
                                Ouvrez le d\u00e9tail pour g\u00e9rer la fiche et les informations du bien.
                              </span>
                            </div>
                            <span className={`${cardStyles.btnView} ${ownerHousingStyles.ownerViewButton}`}>
                              {detailHrefBase ? "Ouvrir la fiche" : "Logement"}
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
