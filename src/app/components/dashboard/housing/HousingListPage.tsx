"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiPlus } from "react-icons/fi";
import cardStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";

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
  isDemo?: boolean;
}

type HousingListPageProps = {
  title: string;
  addHref: string;
  detailHrefBase?: string;
  demoNoticeText?: string;
};

const DEMO_LOGEMENTS: HousingListItem[] = [
  {
    id: -1,
    nom_logement: "Appartement Opera",
    ville: "Paris",
    photo_principale: "/images/default-logement.png",
    infos: {
      categorie: "Appartement",
      capacite: 4,
      equipements: ["Wifi", "Balcon"],
      description: "Adresse centrale, idéale pour les séjours urbains.",
    },
    statut: "pret",
    isDemo: true,
  },
  {
    id: -2,
    nom_logement: "Studio Vieux-Port",
    ville: "Marseille",
    photo_principale: "/images/default-logement.png",
    infos: {
      categorie: "Studio",
      capacite: 2,
      equipements: ["Climatisation", "Wifi"],
      description: "Petit bien lumineux proche du port.",
    },
    statut: "menage",
    isDemo: true,
  },
  {
    id: -3,
    nom_logement: "Maison Chartrons",
    ville: "Bordeaux",
    photo_principale: "/images/default-logement.png",
    infos: {
      categorie: "Maison",
      capacite: 6,
      equipements: ["Jardin", "Parking", "Wifi"],
      description: "Maison familiale pour séjours longs ou courts.",
    },
    statut: "arrivee",
    isDemo: true,
  },
];

function getSafePhoto(photo?: string) {
  return photo && photo.trim() !== "" ? photo : "/images/default-logement.png";
}

function renderStatusLabel(statut: HousingListItem["statut"]) {
  if (statut === "pret") return "Prêt";
  if (statut === "menage") return "Ménage en cours";
  if (statut === "arrivee") return "Arrivée du jour";
  return "Départ du jour";
}

export default function HousingListPage({
  title,
  addHref,
  detailHrefBase,
  demoNoticeText = "Exemples de démonstration affichés. Vos vrais logements sont masqués si les données de test ne sont pas rattachées à votre compte connecté.",
}: HousingListPageProps) {
  const [logements, setLogements] = useState<HousingListItem[]>([]);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [isClaimingDemoData, setIsClaimingDemoData] = useState(false);

  async function loadLogements() {
    try {
      const res = await fetch("/api/housing");
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Impossible de charger les logements");
      }

      if (data.length === 0) {
        setLogements(DEMO_LOGEMENTS);
        setIsUsingDemoData(true);
        return;
      }

      setLogements(data);
      setIsUsingDemoData(false);
    } catch {
      setLogements(DEMO_LOGEMENTS);
      setIsUsingDemoData(true);
    }
  }

  useEffect(() => {
    void loadLogements();
  }, []);

  async function claimDemoLogements() {
    setIsClaimingDemoData(true);
    try {
      for (const logement of DEMO_LOGEMENTS) {
        const response = await fetch("/api/housing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            infos: {
              nomLogement: logement.nom_logement,
              adresse: logement.ville,
              photos: logement.photo_principale ? [logement.photo_principale] : [],
              categorie: logement.infos?.categorie ?? null,
              capacite: logement.infos?.capacite ?? null,
              equipements: logement.infos?.equipements ?? [],
              description: logement.infos?.description ?? null,
            },
            statut: logement.statut,
            photo_principale: logement.photo_principale ?? null,
            proprietaire: {},
            location: {
              city: logement.ville,
            },
          }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(
            typeof result?.error === "string" ? result.error : "Impossible de recréer les exemples",
          );
        }
      }

      await loadLogements();
    } finally {
      setIsClaimingDemoData(false);
    }
  }

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

  return (
    <section className="dashboard-grid">
      <div className={pageStyles.dashboardFlow}>
        <section className={pageStyles.heroPanel}>
          <div className={pageStyles.sectionHeading}>
            <div>
              <p className={pageStyles.eyebrow}>Parc immobilier</p>
              <h1 className={pageStyles.terracottaTitle}>{title}</h1>
              <p className={pageStyles.meta}>
                Visualisez l’état de vos logements, les niveaux de préparation et les fiches à compléter en priorité.
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
              <p className={pageStyles.cardLabel}>Prêts</p>
              <strong className={pageStyles.cardValue}>{stats.prets}</strong>
              <span className={pageStyles.meta}>Biens disponibles ou déjà préparés.</span>
            </article>
            <article className={`${pageStyles.priorityCard} ${pageStyles.priorityWarning}`}>
              <p className={pageStyles.cardLabel}>Mouvements</p>
              <strong className={pageStyles.cardValue}>{stats.arrivees + stats.departs}</strong>
              <span className={pageStyles.meta}>Arrivées et départs du jour à absorber.</span>
            </article>
          </div>
        </section>

        {isUsingDemoData ? (
          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Mode démo</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Exemples de logements</h2>
              </div>
            </div>
            <p className={pageStyles.meta}>{demoNoticeText}</p>
            <div className={pageStyles.inlineActions}>
              <button
                type="button"
                className={pageStyles.buttonPrimary}
                onClick={claimDemoLogements}
                disabled={isClaimingDemoData}
              >
                {isClaimingDemoData ? "Création..." : "Recréer ces exemples dans mon compte"}
              </button>
            </div>
          </section>
        ) : null}

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
                    Capacité : {logement.infos?.capacite ?? "-"} voyageur(s)
                  </span>
                  <span className={cardStyles.metaItem}>
                    Équipements :{" "}
                    {Array.isArray(logement.infos?.equipements) && logement.infos.equipements.length > 0
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
                    {logement.isDemo ? "Exemple" : detailHrefBase ? "Voir ->" : "Logement"}
                  </span>
                </div>
              </div>
            </>
          );

          if (logement.isDemo || !detailHrefBase) {
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
      </div>
    </section>
  );
}
