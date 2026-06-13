"use client";

import Link from "next/link";
import { ArrowRight, Camera, FileText, Home, MapPin, Wrench } from "lucide-react";
import { DashboardSectionShell, MetricDonut } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { buildOwnerHousingCompletion } from "@/app/dashboard/shared";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import styles from "./page.module.scss";

type HousingOverviewItem = {
  id: number;
  nom_logement: string | null;
  ville: string | null;
  statut: string | null;
  photo_principale?: string | null;
  documents?: unknown;
  infos?: {
    categorie?: string | null;
    capacite?: number | null;
    equipements?: string[] | null;
    plateformes?: string[] | null;
    platform?: string | null;
    photos?: string[] | null;
    description?: string | null;
  } | null;
};

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function isActiveHousing(status: string | null | undefined) {
  return ["active", "published", "pret"].includes(String(status ?? ""));
}

function getStatusLabel(status: string | null | undefined) {
  if (isActiveHousing(status)) return "Actif";
  if (status === "menage") return "À préparer";
  if (status === "arrivee") return "Arrivée";
  if (status === "depart") return "Départ";
  return "Brouillon";
}

function getStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  }

  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDocumentCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== "object") return 0;

  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) ? items.length : 0;
}

function getPhotoCount(housing: HousingOverviewItem) {
  const galleryCount = Array.isArray(housing.infos?.photos) ? housing.infos.photos.length : 0;
  return galleryCount + (housing.photo_principale ? 1 : 0);
}

function hasCoreInfo(housing: HousingOverviewItem) {
  return Boolean(
    housing.nom_logement?.trim() &&
      housing.ville?.trim() &&
      housing.infos?.categorie?.trim() &&
      Number(housing.infos?.capacite ?? 0) > 0,
  );
}

function getPlatformList(housing: HousingOverviewItem) {
  const directPlatforms = getStringList(housing.infos?.plateformes);
  if (directPlatforms.length > 0) return directPlatforms;
  return getStringList(housing.infos?.platform);
}

export default function OwnerHousingOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { properties, loading, error } = useOwnerDashboardData(isAuthenticated);
  const housings = properties as HousingOverviewItem[];
  const completion = buildOwnerHousingCompletion(housings as unknown as Record<string, unknown>[]);

  const total = housings.length;
  const activeCount = housings.filter((housing) => isActiveHousing(housing.statut)).length;
  const coreInfoCount = housings.filter(hasCoreInfo).length;
  const photoCount = housings.filter((housing) => getPhotoCount(housing) > 0).length;
  const documentCount = housings.filter((housing) => getDocumentCount(housing.documents) > 0).length;
  const equipmentCount = housings.filter((housing) => getStringList(housing.infos?.equipements).length > 0).length;
  const platformCount = housings.filter((housing) => getPlatformList(housing).length > 0).length;
  const readyCount = housings.filter(
    (housing) =>
      isActiveHousing(housing.statut) &&
      hasCoreInfo(housing) &&
      getPhotoCount(housing) > 0 &&
      getStringList(housing.infos?.equipements).length > 0,
  ).length;

  const donuts = [
    {
      label: "Prêts",
      value: `${readyCount}/${total}`,
      detail: "Exploitables",
      percent: getPercent(readyCount, total),
    },
    {
      label: "Infos clés",
      value: `${coreInfoCount}/${total}`,
      detail: "Nom, ville, type, capacité",
      percent: getPercent(coreInfoCount, total),
    },
    {
      label: "Photos",
      value: `${photoCount}/${total}`,
      detail: "Visuel disponible",
      percent: getPercent(photoCount, total),
    },
    {
      label: "Équipements",
      value: `${equipmentCount}/${total}`,
      detail: "Inventaire renseigné",
      percent: getPercent(equipmentCount, total),
    },
  ];

  const quickChecks = [
    { label: "Logements actifs", value: `${activeCount}/${total}`, icon: Home },
    { label: "Documents", value: `${documentCount}/${total}`, icon: FileText },
    { label: "Plateformes", value: `${platformCount}/${total}`, icon: Wrench },
    { label: "Progression", value: `${completion.percentage}%`, icon: Camera },
  ];

  const priorityItems = completion.missingItems.slice(0, 4);

  return (
    <DashboardSectionShell
      persona="owner"
      title="Vue logements"
      subtitle={error || "Suivez l’état réel de votre parc sans ouvrir chaque fiche."}
      actions={[
        { label: "Voir les logements", href: "/dashboard/owner/logements" },
        { label: "Ajouter un logement", href: "/dashboard/owner/logements/create" },
      ]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Parc propriétaire</span>
            <h1>{total > 0 ? `${total} logement(s) à piloter` : "Ajoutez votre premier logement"}</h1>
            <p>
              La priorité : des fiches complètes, lisibles par vos conciergeries et prêtes pour les missions.
            </p>
          </div>
          <div className={styles.heroScore}>
            <MetricDonut
              label="Santé du parc"
              value={`${completion.percentage}%`}
              detail={completion.percentage >= 100 ? "Tout est prêt" : "À compléter"}
              percent={completion.percentage}
              compact
            />
          </div>
        </section>

        {loading ? <p className={styles.state}>Chargement des logements...</p> : null}

        {!loading && !error ? (
          <>
            <section className={styles.donutGrid} aria-label="Indicateurs logements">
              {donuts.map((donut) => (
                <MetricDonut
                  key={donut.label}
                  label={donut.label}
                  value={donut.value}
                  detail={donut.detail}
                  percent={donut.percent}
                />
              ))}
            </section>

            <section className={styles.layout}>
              <div className={styles.mainColumn}>
                <div className={styles.sectionHeader}>
                  <span className={styles.eyebrow}>Mes logements</span>
                  <h2>Fiches à suivre</h2>
                </div>

                <div className={styles.housingGrid}>
                  {housings.length > 0 ? (
                    housings.map((housing) => {
                      const equipments = getStringList(housing.infos?.equipements);
                      const platforms = getPlatformList(housing);
                      const missing = [
                        !hasCoreInfo(housing) ? "infos clés" : "",
                        getPhotoCount(housing) === 0 ? "photo" : "",
                        equipments.length === 0 ? "équipements" : "",
                      ].filter(Boolean);

                      return (
                        <Link
                          key={housing.id}
                          href={`/dashboard/owner/logements/${housing.id}`}
                          className={styles.housingCard}
                        >
                          <div className={styles.housingTop}>
                            <span className={styles.homeIcon}>
                              <Home size={18} />
                            </span>
                            <span className={styles.status}>{getStatusLabel(housing.statut)}</span>
                          </div>
                          <strong>{housing.nom_logement || `Logement #${housing.id}`}</strong>
                          <span className={styles.city}>
                            <MapPin size={14} />
                            {housing.ville || "Ville à préciser"}
                          </span>
                          <div className={styles.factRow}>
                            <span>{housing.infos?.categorie || "Type à préciser"}</span>
                            <span>
                              {housing.infos?.capacite
                                ? `Capacité maximale : ${housing.infos.capacite} personne(s)`
                                : "Capacité maximale à préciser"}
                            </span>
                          </div>
                          <div className={styles.chipRow}>
                            {(platforms.length > 0 ? platforms : ["Plateforme à préciser"]).slice(0, 3).map((item) => (
                              <span key={`${housing.id}-${item}`}>{item}</span>
                            ))}
                          </div>
                          <p>
                            {missing.length > 0
                              ? `À compléter : ${missing.join(", ")}.`
                              : equipments.slice(0, 4).join(", ") || "Fiche exploitable."}
                          </p>
                          <span className={styles.cardAction}>
                            Ouvrir la fiche <ArrowRight size={15} />
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <Link href="/dashboard/owner/logements/create" className={styles.emptyCard}>
                      <Home size={18} />
                      Ajouter un logement
                    </Link>
                  )}
                </div>
              </div>

              <aside className={styles.sideColumn}>
                <section className={styles.panel}>
                  <span className={styles.eyebrow}>Contrôles</span>
                  <div className={styles.checkList}>
                    {quickChecks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className={styles.checkRow}>
                          <Icon size={17} />
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className={styles.panel}>
                  <span className={styles.eyebrow}>À finaliser</span>
                  {priorityItems.length > 0 ? (
                    <ul className={styles.todoList}>
                      {priorityItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.panelText}>Aucun point bloquant.</p>
                  )}
                  <Link href="/dashboard/owner/logements" className={styles.primaryLink}>
                    Finaliser les fiches
                  </Link>
                </section>
              </aside>
            </section>
          </>
        ) : null}
      </div>
    </DashboardSectionShell>
  );
}
