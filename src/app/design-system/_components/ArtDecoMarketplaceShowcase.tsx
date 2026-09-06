import {
  ChevronRight,
  Home,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import styles from "./ArtDecoMarketplaceShowcase.module.scss";
import { PlatformHeadline } from "@/components/ui/PlatformHeadline/PlatformHeadline";
import { ArtDecoTimeline } from "@/components/ui/ArtDecoTimeline/ArtDecoTimeline";
import { ArtDecoLiveDashboard, ArtDecoSmartSearch, ArtDecoQuotes } from "@/components/ui/ArtDecoWorkspace/ArtDecoWorkspace";

const trustSignals = [
  { label: "Profils vérifiés", value: "1 240" },
  { label: "Temps de réponse moyen", value: "18 min" },
  { label: "Missions tracées", value: "98%" },
];

const journeys = [
  {
    icon: Home,
    title: "Propriétaire",
    text: "Comparer les conciergeries, demander un devis et suivre revenus, missions et preuves sans charge mentale.",
    next: "Voir les partenaires recommandés",
  },
  {
    icon: UsersRound,
    title: "Conciergerie",
    text: "Piloter les demandes, équipes, artisans, packs et tournées depuis un centre de contrôle clair.",
    next: "Organiser la journée",
  },
  {
    icon: Wrench,
    title: "Artisan",
    text: "Recevoir les interventions, accepter vite, optimiser ses trajets et garder le contexte sur mobile.",
    next: "Consulter les missions terrain",
  },
];

const conciergeProfiles = [
  { name: "Maison Riviera", area: "Nice, Villefranche, Eze", score: "4.9", sla: "Réponse 12 min", price: "18% gestion" },
  { name: "Atelier Séjour", area: "Cannes, Antibes", score: "4.8", sla: "SLA premium", price: "Pack à partir de 390 EUR" },
  { name: "Clé d'Azur", area: "Menton, Monaco", score: "4.7", sla: "Urgences 24/7", price: "Sur devis" },
];

const missions = [
  { time: "09:10", label: "Check-out Villa Matisse", status: "En cours", tone: "owner" },
  { time: "11:30", label: "Linge et contrôle qualité", status: "Équipe assignée", tone: "concierge" },
  { time: "14:45", label: "Dépannage serrure", status: "Artisan confirmé", tone: "artisan" },
];

const servicePacks = [
  { title: "Essentiel", price: "12%", items: ["Check-in/out", "Messagerie voyageurs", "Reporting mensuel"] },
  { title: "Signature", price: "18%", items: ["Optimisation revenus", "Équipe dédiée", "Qualité contrôlée"] },
  { title: "Sur-mesure", price: "Devis", items: ["Multibiens", "Maintenance", "Prestataires certifiés"] },
];

export function ArtDecoMarketplaceShowcase() {
  return (
    <div className={styles.shell}>
      <section className={styles.hero} aria-labelledby="showcase-title">
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Planet LS Experience System</span>
          <PlatformHeadline id="showcase-title" />
          <p>
            Une interface Art Deco moderne, rassurante et opérationnelle pour relier propriétaires,
            conciergeries et artisans avec clarté, preuves et efficacité.
          </p>
          <div className={styles.trustGrid}>
            {trustSignals.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ArtDecoLiveDashboard metrics={[{ label: "Revenus suivis", value: "42 800 €", icon: "money" }, { label: "Missions planifiées", value: "36", icon: "missions" }]} detail="Schéma de tournée fictif, sans optimisation ni temps de trajet calculé." />
      </section>

      <section className={styles.personaBand} aria-label="Parcours utilisateurs">
        {journeys.map(({ icon: Icon, title, text, next }) => (
          <article key={title} className={styles.personaCard}>
            <div className={styles.iconFrame}>
              <Icon size={22} aria-hidden />
            </div>
            <h2>{title}</h2>
            <p>{text}</p>
            <button type="button">
              {next}
              <ChevronRight size={16} aria-hidden />
            </button>
          </article>
        ))}
      </section>

      <ArtDecoSmartSearch scope="Conciergeries et partenaires de démonstration" items={conciergeProfiles.map(profile => ({ id: profile.name, title: profile.name, category: "Conciergerie", place: profile.area, detail: `${profile.sla} · ${profile.price}. Conditions à préciser avec le partenaire.`, meta: `Note ${profile.score} · ${profile.price}` }))} />

      <section className={styles.dashboardGrid}>
        <ArtDecoTimeline id="showcase-planning-title" title="Timeline missions" headingLevel="h2"
          items={missions.map(mission => ({ id: mission.label, when: mission.time, title: mission.label, status: mission.status, tone: mission.tone as "owner" | "concierge" | "artisan" }))} />

        <ArtDecoQuotes title="Packs de services" options={servicePacks.map(pack => ({ name: pack.title, price: pack.price, items: pack.items, detail: "Périmètre et conditions illustratifs à adapter au logement et à la mission.", action: `Prévisualiser ${pack.title}` }))} />

        <article className={styles.assurancePanel}>
          <ShieldCheck size={24} aria-hidden />
          <h2>Confiance par la preuve</h2>
          <p>
            Chaque action importante expose un statut, une personne responsable, une preuve ou un délai.
            L&apos;utilisateur garde le contrôle sans devoir chercher l&apos;information.
          </p>
          <div>
            <span>Contrats</span>
            <span>Photos</span>
            <span>Avis</span>
            <span>SLA</span>
          </div>
        </article>

        <article className={styles.messagePanel}>
          <MessageSquareText size={24} aria-hidden />
          <h2>Messagerie contextualisée</h2>
          <p>Conversations reliées aux missions, devis et logements pour éviter les pertes d&apos;information.</p>
        </article>
      </section>
    </div>
  );
}
