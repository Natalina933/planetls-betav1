"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiPlus } from "react-icons/fi";
import styles from "./LogementsPage.module.scss";
import StatsLogements from "../logements/StatsLogements";

interface Logement {
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

const DEMO_LOGEMENTS: Logement[] = [
  {
    id: -1,
    nom_logement: "Appartement Opera",
    ville: "Paris",
    photo_principale: "/images/default-logement.png",
    infos: {
      categorie: "Appartement",
      capacite: 4,
      equipements: ["Wifi", "Balcon"],
      description: "Adresse centrale, ideal pour les sejours urbains.",
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
      description: "Maison familiale pour sejours longs ou courts.",
    },
    statut: "arrivee",
    isDemo: true,
  },
];

function getSafePhoto(photo?: string) {
  return photo && photo.trim() !== "" ? photo : "/images/default-logement.png";
}

function renderStatusLabel(statut: Logement["statut"]) {
  if (statut === "pret") return "Pret";
  if (statut === "menage") return "Menage en cours";
  if (statut === "arrivee") return "Arrivee du jour";
  return "Depart du jour";
}

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>([]);
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
    loadLogements();
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
            typeof result?.error === "string"
              ? result.error
              : "Impossible de recréer les exemples",
          );
        }
      }

      await loadLogements();
    } finally {
      setIsClaimingDemoData(false);
    }
  }

  return (
    <div className={styles.logementsPage}>
      <div className={styles.header}>
        <h1>Mes Logements</h1>
        <Link href="/dashboard/concierge/logements/create" className={styles.btnAdd}>
          <FiPlus /> Ajouter un logement
        </Link>
      </div>

      <StatsLogements
        total={logements.length}
        prets={logements.filter((logement) => logement.statut === "pret").length}
        menages={logements.filter((logement) => logement.statut === "menage").length}
        arrivees={logements.filter((logement) => logement.statut === "arrivee").length}
        departs={logements.filter((logement) => logement.statut === "depart").length}
      />

      {isUsingDemoData && (
        <div className={styles.demoNotice}>
          <p>
            Exemples de demonstration affiches. Tes vrais logements sont masques si les
            donnees de test ne sont pas rattachees a ton compte connecte.
          </p>
          <button
            type="button"
            className={styles.btnAdd}
            onClick={claimDemoLogements}
            disabled={isClaimingDemoData}
          >
            {isClaimingDemoData ? "Creation..." : "Recreer ces exemples dans mon compte"}
          </button>
        </div>
      )}

      <div className={styles.logementsGrid}>
        {logements.map((logement) => {
          const cardContent = (
            <>
              <div className={styles.cardImageWrapper}>
                <Image
                  src={getSafePhoto(logement.photo_principale)}
                  alt={logement.nom_logement}
                  width={220}
                  height={180}
                  className={styles.cardImage}
                />
              </div>

              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>{logement.nom_logement}</h2>

                <p className={styles.cardMeta}>
                  <span className={styles.metaItem}>
                    Type : {logement.infos?.categorie || "Appartement"}
                  </span>
                  <span className={styles.metaItem}>Ville : {logement.ville}</span>
                  <span className={styles.metaItem}>
                    Capacite : {logement.infos?.capacite ?? "-"} voyageur(s)
                  </span>
                  <span className={styles.metaItem}>
                    Equipements :{" "}
                    {Array.isArray(logement.infos?.equipements) && logement.infos.equipements.length > 0
                      ? logement.infos.equipements.slice(0, 3).join(", ")
                      : "-"}
                  </span>
                </p>

                {logement.infos?.description ? (
                  <p className={styles.cardDescription}>{logement.infos.description}</p>
                ) : null}

                <div className={styles.cardFooter}>
                  <span className={`${styles.status} ${styles[`status-${logement.statut}`]}`}>
                    {renderStatusLabel(logement.statut)}
                  </span>

                  <span className={styles.btnView}>
                    {logement.isDemo ? "Exemple" : "Voir ->"}
                  </span>
                </div>
              </div>
            </>
          );

          if (logement.isDemo) {
            return (
              <div key={logement.id} className={styles.logementCard}>
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={logement.id}
              href={`/dashboard/concierge/logements/${logement.id}`}
              className={styles.logementCard}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
