import {
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Euro,
  Filter,
  Home,
  MapPin,
  MessageSquareText,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Wrench,
} from "lucide-react";
import styles from "./ArtDecoMarketplaceShowcase.module.scss";

const trustSignals = [
  { label: "Profils verifies", value: "1 240" },
  { label: "Temps de reponse moyen", value: "18 min" },
  { label: "Missions tracees", value: "98%" },
];

const journeys = [
  {
    icon: Home,
    title: "Proprietaire",
    text: "Comparer les conciergeries, demander un devis et suivre revenus, missions et preuves sans charge mentale.",
    next: "Voir les partenaires recommandes",
  },
  {
    icon: UsersRound,
    title: "Conciergerie",
    text: "Piloter les demandes, equipes, artisans, packs et tournees depuis un centre de controle clair.",
    next: "Organiser la journee",
  },
  {
    icon: Wrench,
    title: "Artisan",
    text: "Recevoir les interventions, accepter vite, optimiser ses trajets et garder le contexte sur mobile.",
    next: "Consulter les missions terrain",
  },
];

const conciergeProfiles = [
  { name: "Maison Riviera", area: "Nice, Villefranche, Eze", score: "4.9", sla: "Reponse 12 min", price: "18% gestion" },
  { name: "Atelier Sejour", area: "Cannes, Antibes", score: "4.8", sla: "SLA premium", price: "Pack a partir de 390 EUR" },
  { name: "Cle d'Azur", area: "Menton, Monaco", score: "4.7", sla: "Urgences 24/7", price: "Sur devis" },
];

const missions = [
  { time: "09:10", label: "Check-out Villa Matisse", status: "En cours", tone: "owner" },
  { time: "11:30", label: "Linge et controle qualite", status: "Equipe assignee", tone: "concierge" },
  { time: "14:45", label: "Depannage serrure", status: "Artisan confirme", tone: "artisan" },
];

const servicePacks = [
  { title: "Essentiel", price: "12%", items: ["Check-in/out", "Messagerie voyageurs", "Reporting mensuel"] },
  { title: "Signature", price: "18%", items: ["Optimisation revenus", "Equipe dediee", "Qualite controlee"] },
  { title: "Sur-mesure", price: "Devis", items: ["Multibiens", "Maintenance", "Prestataires certifies"] },
];

export function ArtDecoMarketplaceShowcase() {
  return (
    <main className={styles.shell}>
      <section className={styles.hero} aria-labelledby="showcase-title">
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Planet LS Experience System</span>
          <h1 id="showcase-title">Une plateforme premium pour orchestrer la location saisonniere</h1>
          <p>
            Une interface Art Deco moderne, rassurante et operationnelle pour relier proprietaires,
            conciergeries et artisans avec clarte, preuves et efficacite.
          </p>
          <div className={styles.searchBar} role="search">
            <Search size={20} aria-hidden />
            <input aria-label="Recherche intelligente" placeholder="Ville, logement, service, mission urgente..." />
            <button type="button">Rechercher</button>
          </div>
          <div className={styles.trustGrid}>
            {trustSignals.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.commandCenter} aria-label="Apercu du pilotage operationnel">
          <div className={styles.commandHeader}>
            <span>Tableau de bord live</span>
            <BadgeCheck size={18} aria-hidden />
          </div>
          <div className={styles.metricRow}>
            <div>
              <Euro size={18} aria-hidden />
              <strong>42 800 EUR</strong>
              <span>Revenus suivis</span>
            </div>
            <div>
              <CalendarCheck size={18} aria-hidden />
              <strong>36</strong>
              <span>Missions planifiees</span>
            </div>
          </div>
          <div className={styles.routePanel}>
            <div className={styles.mapGrid}>
              <span className={styles.pinOne} />
              <span className={styles.pinTwo} />
              <span className={styles.pinThree} />
            </div>
            <div>
              <Route size={20} aria-hidden />
              <strong>Tournee optimisee</strong>
              <span>23 min gagnees aujourd&apos;hui</span>
            </div>
          </div>
        </div>
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

      <section className={styles.workspace}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Recherche intelligente</span>
            <h2>Comparer, filtrer, cartographier</h2>
          </div>
          <button type="button" className={styles.iconButton} aria-label="Ouvrir les filtres">
            <Filter size={19} aria-hidden />
          </button>
        </div>
        <div className={styles.marketGrid}>
          <aside className={styles.filters}>
            <label>
              Localisation
              <input defaultValue="Nice centre" />
            </label>
            <label>
              Besoin principal
              <select defaultValue="gestion">
                <option value="gestion">Gestion complete</option>
                <option value="maintenance">Maintenance</option>
                <option value="menage">Menage et linge</option>
              </select>
            </label>
            <label>
              Niveau de service
              <select defaultValue="premium">
                <option value="premium">Premium verifie</option>
                <option value="fast">Intervention rapide</option>
                <option value="local">Reseau local</option>
              </select>
            </label>
          </aside>
          <div className={styles.resultsList}>
            {conciergeProfiles.map((profile) => (
              <article key={profile.name} className={styles.profileResult}>
                <div>
                  <h3>{profile.name}</h3>
                  <p>
                    <MapPin size={15} aria-hidden />
                    {profile.area}
                  </p>
                </div>
                <div className={styles.profileProof}>
                  <span>
                    <Star size={15} aria-hidden />
                    {profile.score}
                  </span>
                  <span>{profile.sla}</span>
                  <strong>{profile.price}</strong>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.mapPreview} aria-label="Carte interactive des prestataires" role="img">
            <span className={styles.mapPinA}>A</span>
            <span className={styles.mapPinB}>B</span>
            <span className={styles.mapPinC}>C</span>
          </div>
        </div>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.timelinePanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Organisation</span>
              <h2>Timeline missions</h2>
            </div>
            <Clock3 size={20} aria-hidden />
          </div>
          <ol className={styles.timeline}>
            {missions.map((mission) => (
              <li key={mission.label}>
                <time>{mission.time}</time>
                <div>
                  <strong>{mission.label}</strong>
                  <span data-tone={mission.tone}>{mission.status}</span>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className={styles.quotePanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Devis dynamique</span>
              <h2>Packs de services</h2>
            </div>
            <Sparkles size={20} aria-hidden />
          </div>
          <div className={styles.packGrid}>
            {servicePacks.map((pack) => (
              <div key={pack.title} className={styles.packCard}>
                <h3>{pack.title}</h3>
                <strong>{pack.price}</strong>
                {pack.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ))}
          </div>
        </article>

        <article className={styles.assurancePanel}>
          <ShieldCheck size={24} aria-hidden />
          <h2>Confiance par la preuve</h2>
          <p>
            Chaque action importante expose un statut, une personne responsable, une preuve ou un delai.
            L&apos;utilisateur garde le controle sans devoir chercher l&apos;information.
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
          <h2>Messagerie contextualisee</h2>
          <p>Conversations reliees aux missions, devis et logements pour eviter les pertes d&apos;information.</p>
        </article>
      </section>
    </main>
  );
}
