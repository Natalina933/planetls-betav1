"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

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

  const activeProperties = useMemo(
    () =>
      properties.filter(
        (property) => property.statut === "active" || property.statut === "published",
      ).length,
    [properties],
  );
  const equippedProperties = useMemo(
    () =>
      properties.filter(
        (property) =>
          Array.isArray(property.infos?.equipements) && property.infos.equipements.length > 0,
      ).length,
    [properties],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Biens"
      title="Logements"
      description={
        error
          ? error
          : "Consultez les informations essentielles de vos biens et leur niveau de preparation."
      }
      chips={[
        `${properties.length} logement(s)`,
        `${activeProperties} actif(s)`,
        `${equippedProperties} avec equipements`,
      ]}
      metrics={[
        { label: "Biens", value: `${properties.length}`, hint: `${activeProperties} actif(s)` },
        {
          label: "Preparation",
          value: `${equippedProperties}`,
          hint: "logement(s) avec equipements renseignes",
        },
      ]}
      actions={[
        { label: "Ajouter un logement", href: "/dashboard/concierge/logements/create" },
        { label: "Voir le planning", href: "/dashboard/owner/planning" },
      ]}
      cards={[
        {
          title: "Portefeuille immobilier",
          text: loading
            ? "Chargement de vos logements..."
            : properties.length > 0
              ? `${properties.length} bien(s) sont actuellement rattaches a votre compte.`
              : "Vous n'avez pas encore de logement visible sur votre compte.",
        },
        {
          title: "Etat de publication",
          text: `${activeProperties} logement(s) sont actifs ou publies. Les autres restent en brouillon ou archives.`,
        },
      ]}
      detailSections={[
        {
          title: "Liste des logements",
          description: "Vue synthetique de vos biens et de leur niveau de preparation.",
          emptyText:
            "Commencez par creer un logement pour centraliser vos biens, vos missions et vos futurs devis.",
          items: properties.map((property) => ({
            title: property.nom_logement || "Logement sans nom",
            meta: getStatusLabel(property.statut),
            description: [
              property.infos?.categorie || "Type non renseigne",
              property.ville || "Ville non renseignee",
              property.adresse || "Adresse non renseignee",
              `Plateforme ${property.plateforme || "non renseignee"}`,
              `Capacite ${property.infos?.capacite ?? "-"}`,
              `Chambres ${property.infos?.nb_chambres ?? "-"}`,
              Array.isArray(property.infos?.equipements) && property.infos.equipements.length > 0
                ? `Equipements: ${property.infos.equipements.join(", ")}`
                : "Equipements non renseignes",
            ].join(" | "),
          })),
        },
      ]}
    />
  );
}
