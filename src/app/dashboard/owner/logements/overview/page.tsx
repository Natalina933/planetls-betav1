"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowRight, BedDouble, Camera, CheckCircle2, FileText, Home, MapPin, Plus, Users, Wrench } from "lucide-react";
import { DashboardSectionShell } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { toHousingPhotoUrl } from "@/app/lib/housingPhotoUrl";
import { useOwnerDashboardData } from "../../useOwnerDashboardData";
import styles from "./page.module.scss";

type HousingOverviewItem = {
  id: number; nom_logement: string | null; ville: string | null; statut: string | null;
  photo_principale?: string | null; documents?: unknown;
  infos?: { categorie?: string | null; capacite?: number | null; chambres?: number | null; bedroom_count?: number | null; equipements?: string[] | null; plateformes?: string[] | null; platform?: string | null; photos?: string[] | null; description?: string | null } | null;
};

const FALLBACK_PHOTO = "/images/default-logement.png";
const isActive = (status?: string | null) => ["active", "published", "pret"].includes(String(status ?? ""));
function statusLabel(status?: string | null) { if (isActive(status)) return "Actif"; if (status === "menage") return "À préparer"; if (status === "arrivee") return "Arrivée"; if (status === "depart") return "Départ"; return "Brouillon"; }
function stringList(value: unknown): string[] { if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean); return typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : []; }
function documentCount(value: unknown) { if (Array.isArray(value)) return value.length; if (!value || typeof value !== "object") return 0; const items = (value as { items?: unknown }).items; return Array.isArray(items) ? items.length : 0; }
function photoCount(housing: HousingOverviewItem) { return (Array.isArray(housing.infos?.photos) ? housing.infos.photos.length : 0) + (housing.photo_principale ? 1 : 0); }
function hasCoreInfo(housing: HousingOverviewItem) { return Boolean(housing.nom_logement?.trim() && housing.ville?.trim() && housing.infos?.categorie?.trim() && Number(housing.infos?.capacite ?? 0) > 0); }
function platforms(housing: HousingOverviewItem) { const direct = stringList(housing.infos?.plateformes); return direct.length ? direct : stringList(housing.infos?.platform); }
function missingItems(housing: HousingOverviewItem) { return [!hasCoreInfo(housing) ? "informations" : "", photoCount(housing) === 0 ? "photos" : "", stringList(housing.infos?.equipements).length === 0 ? "équipements" : ""].filter(Boolean); }
function photoUrl(housing: HousingOverviewItem) { const photo = housing.photo_principale?.trim(); return photo ? toHousingPhotoUrl(photo, housing.id) : FALLBACK_PHOTO; }

export default function OwnerHousingOverviewPage() {
  const { isAuthenticated } = useCurrentUser();
  const { properties, loading, error } = useOwnerDashboardData(isAuthenticated);
  const housings = properties as HousingOverviewItem[];
  const total = housings.length;
  const activeCount = housings.filter((housing) => isActive(housing.statut)).length;
  const withPhotos = housings.filter((housing) => photoCount(housing) > 0).length;
  const withDocuments = housings.filter((housing) => documentCount(housing.documents) > 0).length;
  const withPlatforms = housings.filter((housing) => platforms(housing).length > 0).length;
  const readyCount = housings.filter((housing) => isActive(housing.statut) && missingItems(housing).length === 0).length;
  const completionPercentage = total > 0 ? Math.round((readyCount / total) * 100) : 0;
  const priorities = housings
    .map((housing) => {
      const missing = missingItems(housing);
      return missing.length ? `${housing.nom_logement || `Logement #${housing.id}`} : ${missing.join(", ")}` : "";
    })
    .filter(Boolean)
    .slice(0, 4);
  const stats = [
    { label: "Logements actifs", value: activeCount, icon: Home },
    { label: "Fiches prêtes", value: readyCount, icon: CheckCircle2 },
    { label: "Avec photos", value: withPhotos, icon: Camera },
    { label: "Avec documents", value: withDocuments, icon: FileText },
  ];

  return <DashboardSectionShell persona="owner" title="Vue d’ensemble des logements" subtitle={error || "Pilotez votre parc et ouvrez rapidement la fiche qui demande votre attention."}>
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="overview-title">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Votre parc immobilier</span>
          <h2 id="overview-title">{total ? `${total} logement${total > 1 ? "s" : ""} à piloter` : "Votre premier logement vous attend"}</h2>
          <p>Retrouvez l’état de vos fiches, leurs informations essentielles et les actions à mener avant les prochains séjours.</p>
          <div className={styles.heroActions}><Link href="/dashboard/owner/logements" className={styles.primaryAction}>Voir mes logements <ArrowRight size={16} /></Link><Link href="/dashboard/owner/logements/create" className={styles.secondaryAction}><Plus size={16} /> Ajouter</Link></div>
        </div>
        <div className={styles.healthCard}>
          <div className={styles.healthRing} style={{ "--progress": `${completionPercentage * 3.6}deg` } as React.CSSProperties}><div><strong>{completionPercentage}%</strong><span>complété</span></div></div>
          <div className={styles.healthCopy}><span>Santé du parc</span><strong>{completionPercentage >= 100 ? "Toutes les fiches sont prêtes" : "Quelques informations restent à renseigner"}</strong><small>{readyCount} fiche{readyCount > 1 ? "s" : ""} prête{readyCount > 1 ? "s" : ""} à être exploitée{readyCount > 1 ? "s" : ""}</small></div>
        </div>
      </section>

      {loading ? <p className={styles.state}>Chargement des logements…</p> : null}
      {!loading && !error ? <>
        <section className={styles.statsGrid} aria-label="Indicateurs du parc">{stats.map(({ label, value, icon: Icon }) => <article key={label} className={styles.statCard}><span className={styles.statIcon}><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong> <small>sur {total}</small></div></article>)}</section>
        <div className={styles.contentLayout}>
          <section className={styles.mainColumn} aria-labelledby="housing-list-title">
            <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Mes logements</span><h2 id="housing-list-title">Le parc en un coup d’œil</h2></div><Link href="/dashboard/owner/logements" className={styles.textLink}>Voir la liste <ArrowRight size={15} /></Link></div>
            <div className={styles.housingGrid}>{housings.length ? housings.map((housing) => {
              const missing = missingItems(housing); const equipments = stringList(housing.infos?.equipements); const bedrooms = Number(housing.infos?.chambres ?? housing.infos?.bedroom_count ?? 0);
              return <article key={housing.id} className={styles.housingCard}>
                <Link href={`/dashboard/owner/logements/${housing.id}`} className={styles.photoLink} aria-label={`Ouvrir la fiche ${housing.nom_logement || housing.id}`}><Image src={photoUrl(housing)} alt="" fill sizes="(max-width: 760px) 100vw, 40vw" className={styles.housingPhoto} unoptimized /><span className={`${styles.status} ${isActive(housing.statut) ? styles.activeStatus : ""}`}>{statusLabel(housing.statut)}</span><span className={styles.photoCount}><Camera size={13} /> {photoCount(housing)}</span></Link>
                <div className={styles.cardBody}><div className={styles.cardHeading}><div><span>{housing.infos?.categorie || "Type à préciser"}</span><h3>{housing.nom_logement || `Logement #${housing.id}`}</h3></div><Link href={`/dashboard/owner/logements/${housing.id}`} className={styles.openButton} aria-label={`Consulter ${housing.nom_logement || `le logement ${housing.id}`}`}><ArrowRight size={17} /></Link></div>
                  <p className={styles.location}><MapPin size={14} /> {housing.ville || "Ville à préciser"}</p>
                  <div className={styles.facts}><span><Users size={15} /> {housing.infos?.capacite ? `${housing.infos.capacite} pers.` : "Capacité à préciser"}</span>{bedrooms > 0 ? <span><BedDouble size={15} /> {bedrooms} chambre{bedrooms > 1 ? "s" : ""}</span> : null}{equipments[0] ? <span><Wrench size={15} /> {equipments[0]}</span> : null}</div>
                  <div className={missing.length ? styles.completionWarning : styles.completionSuccess}>{missing.length ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}<span>{missing.length ? `À compléter : ${missing.join(", ")}` : "Fiche prête pour l’exploitation"}</span></div>
                </div>
              </article>;
            }) : <Link href="/dashboard/owner/logements/create" className={styles.emptyCard}><Plus size={22} /><strong>Ajouter votre premier logement</strong><span>Créez sa fiche pour commencer à le piloter.</span></Link>}</div>
          </section>
          <aside className={styles.sideColumn} aria-label="Suivi du parc">
            <section className={styles.sidePanel}><div className={styles.panelHeading}><span className={styles.panelIcon}><AlertCircle size={17} /></span><div><span className={styles.eyebrow}>Priorités</span><h2>À finaliser</h2></div></div>{priorities.length ? <ul className={styles.todoList}>{priorities.map((item) => <li key={item}>{item}</li>)}</ul> : <div className={styles.allDone}><CheckCircle2 size={20} /><p>Aucun point bloquant. Votre parc est à jour.</p></div>}<Link href="/dashboard/owner/logements?filter=review" className={styles.panelAction}>Finaliser les fiches <ArrowRight size={15} /></Link></section>
            <section className={styles.sidePanel}><div className={styles.panelHeading}><span className={styles.panelIcon}><Wrench size={17} /></span><div><span className={styles.eyebrow}>Diffusion</span><h2>Visibilité</h2></div></div><div className={styles.checkList}><div><span>Plateformes renseignées</span><strong>{withPlatforms}/{total}</strong></div><div><span>Logements actifs</span><strong>{activeCount}/{total}</strong></div><div><span>Progression générale</span><strong>{completionPercentage}%</strong></div></div></section>
            <blockquote className={styles.quote}>« Des logements bien préparés, des séjours plus sereins. »<cite>PlanetLS</cite></blockquote>
          </aside>
        </div>
      </> : null}
    </div>
  </DashboardSectionShell>;
}
