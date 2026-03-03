"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../OwnerDashboardPages.module.scss";

type HousingRow = {
  id: number;
  nom_logement: string | null;
  ville: string | null;
  statut: string | null;
  infos?: {
    equipements?: string[];
  } | null;
};

export default function OwnerStocksPage() {
  const [housing, setHousing] = useState<HousingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHousing() {
      try {
        setError(null);
        const response = await fetch("/api/housing", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos logements.");
        }

        setHousing(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos stocks.");
      }
    }

    void loadHousing();
  }, []);

  const totalHousing = housing.length;
  const equippedHousing = useMemo(
    () =>
      housing.filter(
        (item) => Array.isArray(item.infos?.equipements) && item.infos!.equipements!.length > 0,
      ),
    [housing],
  );
  const missingEquipmentHousing = useMemo(
    () =>
      housing.filter(
        (item) => !Array.isArray(item.infos?.equipements) || item.infos!.equipements!.length === 0,
      ),
    [housing],
  );
  const allEquipment = useMemo(
    () =>
      equippedHousing.flatMap((item) => item.infos?.equipements ?? []).reduce<Record<string, number>>(
        (accumulator, label) => {
          accumulator[label] = (accumulator[label] ?? 0) + 1;
          return accumulator;
        },
        {},
      ),
    [equippedHousing],
  );
  const topEquipment = Object.entries(allEquipment)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <section className="dashboard-grid">
      <div className={styles.dashboardFlow}>
        <section className={styles.heroPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Logistique du parc</p>
              <h1 className={styles.terracottaTitle}>Stocks et consommables</h1>
              <p className={styles.meta}>
                {error ||
                  "Visualisez les équipements renseignés par logement et repérez rapidement les biens qui manquent encore de stock ou de préparation."}
              </p>
            </div>
            <div className={styles.inlineActions}>
              <Link href="/dashboard/owner/logements" className={styles.buttonSecondary}>
                Voir mes logements
              </Link>
              <Link href="/dashboard/owner/planning" className={styles.buttonPrimary}>
                Voir le planning
              </Link>
            </div>
          </div>

          <div className={styles.priorityGrid}>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Logements suivis</p>
              <strong className={styles.cardValue}>{totalHousing}</strong>
              <span className={styles.meta}>Base du stock à couvrir sur votre parc.</span>
            </article>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Fiches équipées</p>
              <strong className={styles.cardValue}>{equippedHousing.length}</strong>
              <span className={styles.meta}>Biens avec équipements déjà renseignés.</span>
            </article>
            <article className={`${styles.priorityCard} ${styles.priorityWarning}`}>
              <p className={styles.cardLabel}>À compléter</p>
              <strong className={styles.cardValue}>{missingEquipmentHousing.length}</strong>
              <span className={styles.meta}>Logements sans équipements ou consommables saisis.</span>
            </article>
          </div>
        </section>

        <div className={styles.sectionGrid}>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Vue parc</p>
                <h2 className={styles.terracottaSectionTitle}>Équipements les plus présents</h2>
              </div>
            </div>
            {topEquipment.length ? (
              <div className={styles.statsList}>
                {topEquipment.map(([label, count]) => {
                  const ratio = totalHousing > 0 ? Math.min(100, Math.round((count / totalHousing) * 100)) : 0;
                  return (
                    <div key={label} className={styles.metricRow}>
                      <div className={styles.metricLabel}>
                        <span>{label}</span>
                        <span>{count}</span>
                      </div>
                      <div className={styles.metricTrack}>
                        <div className={styles.metricBar} style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.meta}>Aucun équipement n’est encore renseigné.</p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Points de vigilance</p>
                <h2 className={styles.terracottaSectionTitle}>Logements à compléter</h2>
              </div>
            </div>
            {missingEquipmentHousing.length ? (
              <ul className={styles.list}>
                {missingEquipmentHousing.slice(0, 6).map((item) => (
                  <li key={item.id} className={styles.listItem}>
                    <strong>{item.nom_logement || `Logement #${item.id}`}</strong>
                    <p className={styles.meta}>
                      {item.ville || "Ville non renseignée"} | {item.statut || "Brouillon"}
                    </p>
                    <Link href={`/dashboard/owner/logements/${item.id}`} className={styles.cardAction}>
                      Compléter la fiche
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.meta}>Tous les logements ont au moins un premier niveau d’équipement saisi.</p>
            )}
          </section>
        </div>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Lecture détaillée</p>
              <h2 className={styles.terracottaSectionTitle}>Par logement</h2>
            </div>
          </div>
          {housing.length ? (
            <ul className={styles.list}>
              {housing.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <strong>{item.nom_logement || `Logement #${item.id}`}</strong>
                  <p className={styles.meta}>
                    {item.ville || "Ville non renseignée"} |{" "}
                    {Array.isArray(item.infos?.equipements) && item.infos.equipements.length > 0
                      ? item.infos.equipements.join(", ")
                      : "Aucun équipement renseigné"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.meta}>Aucun logement disponible pour le moment.</p>
          )}
        </section>
      </div>
    </section>
  );
}
