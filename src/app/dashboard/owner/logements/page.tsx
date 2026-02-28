"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./OwnerLogementsPage.module.scss";

type OwnerHousingRow = {
  id: number;
  nom_logement: string | null;
  ville: string | null;
  adresse: string | null;
  statut: string | null;
  plateforme: string | null;
  infos?: {
    categorie?: string;
    capacite?: number;
    nb_chambres?: number;
    equipements?: string[];
    description?: string;
  } | null;
};

function getStatusLabel(status: string | null) {
  switch (status) {
    case "active":
    case "published":
      return "Actif";
    case "deleted":
      return "Archive";
    default:
      return "Brouillon";
  }
}

export default function OwnerLogementsPage() {
  const [properties, setProperties] = useState<OwnerHousingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwnerHousing() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/housing", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos logements.");
        }

        setProperties(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos logements.");
      } finally {
        setLoading(false);
      }
    }

    fetchOwnerHousing();
  }, []);

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Mes logements</h1>
        <p>Consultez les informations essentielles de vos biens et leur niveau de preparation.</p>
      </header>

      <div className="main-section">
        <div className={styles.page}>
          <div className={styles.actions}>
            <h2>Portefeuille immobilier</h2>
            <Link href="/dashboard/concierge/logements/create">Ajouter un logement</Link>
          </div>

          {loading ? <p>Chargement de vos logements...</p> : null}
          {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

          {!loading && !error && properties.length === 0 ? (
            <div>
              <p>Vous n'avez pas encore de logement visible sur votre compte.</p>
              <p>
                Commencez par créer un logement pour centraliser vos biens, vos missions et vos
                futurs devis.
              </p>
            </div>
          ) : null}

          {!loading && !error && properties.length > 0 ? (
            <div className={styles.grid}>
              {properties.map((property) => (
                <article key={property.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <strong className={styles.cardTitle}>
                      {property.nom_logement || "Logement sans nom"}
                    </strong>
                    <span className={styles.badge}>{getStatusLabel(property.statut)}</span>
                  </div>

                  <div className={styles.meta}>
                    <span>{property.infos?.categorie || "Type non renseigne"}</span>
                    <span>{property.ville || "Ville non renseignee"}</span>
                    <span>{property.adresse || "Adresse non renseignee"}</span>
                    <span>Plateforme : {property.plateforme || "Non renseignee"}</span>
                    <span>Capacité : {property.infos?.capacite ?? "-"}</span>
                    <span>Chambres : {property.infos?.nb_chambres ?? "-"}</span>
                  </div>

                  {property.infos?.description ? (
                    <p className={styles.description}>{property.infos.description}</p>
                  ) : null}

                  <div className={styles.equipments}>
                    {Array.isArray(property.infos?.equipements) &&
                    property.infos.equipements.length > 0 ? (
                      property.infos.equipements.map((equipment) => (
                        <span key={equipment} className={styles.chip}>
                          {equipment}
                        </span>
                      ))
                    ) : (
                      <span className={styles.chip}>Équipements non renseignés</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
