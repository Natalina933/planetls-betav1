"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiTarget } from "react-icons/fi";
import { FiPlus } from "react-icons/fi";
import { DashboardSectionShell } from "@/components/dashboard";
import cardStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";
import profileStyles from "@/app/dashboard/concierge/profile/ConciergeProfilePage.module.scss";
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
  if (statut === "pret") return "Pret";
  if (statut === "menage") return "Menage en cours";
  if (statut === "arrivee") return "Arrivee du jour";
  return "Depart du jour";
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
      subtitle="Visualisez l'etat de vos logements, les mouvements et les fiches a finaliser."
      stats={[
        { label: "Logements", value: `${stats.total}` },
        { label: "Prets", value: `${stats.prets}` },
        { label: "Menage", value: `${stats.menages}` },
        { label: "Mouvements", value: `${stats.arrivees + stats.departs}` },
      ]}
      actions={[
        { label: "Ajouter un logement", href: addHref },
      ]}
    >
      <div className={pageStyles.dashboardFlow}>
        <section className={pageStyles.heroPanel}>
          <div className={pageStyles.sectionHeading}>
            <div>
              <p className={pageStyles.eyebrow}>Parc immobilier</p>
              <h1 className={pageStyles.terracottaTitle}>{title}</h1>
              <p className={pageStyles.meta}>
                Visualisez l&apos;etat de vos logements et les fiches a completer en priorite.
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
              <p className={pageStyles.cardLabel}>Prets</p>
              <strong className={pageStyles.cardValue}>{stats.prets}</strong>
              <span className={pageStyles.meta}>Biens disponibles ou deja prepares.</span>
            </article>
            <article className={`${pageStyles.priorityCard} ${pageStyles.priorityWarning}`}>
              <p className={pageStyles.cardLabel}>Mouvements</p>
              <strong className={pageStyles.cardValue}>{stats.arrivees + stats.departs}</strong>
              <span className={pageStyles.meta}>Arrivees et departs a absorber.</span>
            </article>
          </div>
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
                  Aucun logement reel n&apos;est encore enregistre sur votre compte.
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
                              Capacite : {logement.infos?.capacite ?? "-"} voyageur(s)
                            </span>
                            <span className={cardStyles.metaItem}>
                              Equipements :{" "}
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
                            <span className={cardStyles.btnView}>
                              {detailHrefBase ? "Voir ->" : "Logement"}
                            </span>
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
                              Capacite : {logement.infos?.capacite ?? "-"} voyageur(s)
                            </span>
                            <span className={cardStyles.metaItem}>
                              Equipements :{" "}
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
                            <span className={cardStyles.btnView}>
                              {detailHrefBase ? "Voir ->" : "Logement"}
                            </span>
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
                </div>
              </section>
            )
          : null}
      </div>
    </DashboardSectionShell>
  );
}
