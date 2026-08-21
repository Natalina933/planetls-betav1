import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Building2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileWarning,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Badge, ButtonLink, Card, CardBody, CardHeader } from "@/components/ui";
import styles from "./page.module.scss";

const priorities = [
  { title: "3 missions sans prestataire", detail: "Une intervention commence dans moins de 24 heures.", tone: "danger" as const, label: "Critique", action: "Voir les missions", href: "#requests" },
  { title: "7 profils a verifier", detail: "Les justificatifs sont recus et attendent une decision.", tone: "warning" as const, label: "Attention", action: "Ouvrir le controle", href: "#requests" },
  { title: "Activation en hausse", detail: "+12 % de proprietaires actifs sur les 7 derniers jours.", tone: "success" as const, label: "Information", action: "Voir les indicateurs", href: "#kpis" },
];

const activity = [
  ["Nouvelle demande qualifiee", "Lyon 2e - menage et linge", "Il y a 8 min"],
  ["Mission terminee", "Villa Azur - rapport et photos disponibles", "Il y a 23 min"],
  ["Conciergerie verifiee", "Maison d'Hotes & Co", "Il y a 42 min"],
];

export default function AdminDashboardPrototypePage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/design-system" className={styles.backLink}>Design System</Link>
        <span>Prototype interne - aucune donnee reelle</span>
      </header>

      <section className={styles.pageHeader} aria-labelledby="prototype-title">
        <div>
          <p className={styles.eyebrow}>Centre de pilotage PlanetLS</p>
          <h1 id="prototype-title">Aujourd'hui sur PlanetLS</h1>
          <p className={styles.headerLead}>Les signaux a traiter, l'activite du reseau et les operations qui demandent votre attention.</p>
        </div>
        <div className={styles.headerMeta}>
          <span>Vue des 30 derniers jours</span>
          <ButtonLink href="#priorities">Traiter les priorites <ArrowUpRight size={16} aria-hidden="true" /></ButtonLink>
        </div>
      </section>

      <section id="kpis" className={styles.kpis} aria-label="Indicateurs cles">
        <Metric icon={<UsersRound />} label="Utilisateurs actifs" value="1 284" trend="+8,2 %" detail="sur 30 jours" />
        <Metric icon={<Building2 />} label="Logements suivis" value="386" trend="+24" detail="ce mois-ci" />
        <Metric icon={<Activity />} label="Missions en cours" value="47" trend="12 urgentes" detail="a surveiller" warning />
        <Metric icon={<ShieldCheck />} label="Parcours sains" value="92 %" trend="+3 pts" detail="sans blocage" />
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <Card id="priorities" className={styles.priorityCard} tone="soft">
            <CardHeader>
              <div><p className={styles.sectionEyebrow}>A traiter maintenant</p><h2>Priorites operationnelles</h2></div>
              <Badge variant="gold">3 signaux</Badge>
            </CardHeader>
            <CardBody>
              <div className={styles.priorityList}>
                {priorities.map((priority) => (
                  <article key={priority.title} className={styles.priorityRow}>
                    <span className={`${styles.priorityIcon} ${styles[priority.tone]}`}><CircleAlert size={18} aria-hidden="true" /></span>
                    <div><div className={styles.priorityTitle}><Badge variant={priority.tone}>{priority.label}</Badge><h3>{priority.title}</h3></div><p>{priority.detail}</p></div>
                    <ButtonLink href={priority.href} variant="ghost" size="sm" aria-label={`${priority.action} : ${priority.title}`}>{priority.action}<ChevronRight size={16} aria-hidden="true" /></ButtonLink>
                  </article>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card id="requests" className={styles.tableCard} tone="elevated">
            <CardHeader><div><p className={styles.sectionEyebrow}>Flux en cours</p><h2>Demandes a suivre</h2></div><ButtonLink href="#requests" variant="ghost">Voir tout</ButtonLink></CardHeader>
            <CardBody>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Les trois demandes les plus importantes a suivre aujourd'hui.</caption>
                  <thead><tr><th scope="col">Demande</th><th scope="col">Zone</th><th scope="col">Statut</th><th scope="col">Prochaine action</th></tr></thead>
                  <tbody>
                    <tr><th scope="row"><strong>Check-in weekend</strong><span>Ref. PL-2048</span></th><td>Biarritz</td><td><Badge variant="warning">En attente</Badge></td><td><ButtonLink href="#requests" variant="ghost" size="sm">Assigner</ButtonLink></td></tr>
                    <tr><th scope="row"><strong>Maintenance climatiseur</strong><span>Ref. PL-2047</span></th><td>Montpellier</td><td><Badge variant="danger">Urgent</Badge></td><td><ButtonLink href="#requests" variant="ghost" size="sm">Voir la mission</ButtonLink></td></tr>
                    <tr><th scope="row"><strong>Devis linge saison</strong><span>Ref. PL-2044</span></th><td>Annecy</td><td><Badge variant="info">Devis recu</Badge></td><td><ButtonLink href="#requests" variant="ghost" size="sm">Verifier</ButtonLink></td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className={styles.sideColumn}>
          <Card tone="dark" className={styles.controlCard}>
            <CardBody><BellRing size={22} aria-hidden="true" /><p>Controle du jour</p><strong>10 actions demandent une decision humaine.</strong><ButtonLink href="#priorities" variant="paper">Ouvrir le centre de controle</ButtonLink></CardBody>
          </Card>
          <Card tone="outlined" className={styles.activityCard}>
            <CardHeader><div><p className={styles.sectionEyebrow}>En direct</p><h2>Activite recente</h2></div><Clock3 size={18} aria-hidden="true" /></CardHeader>
            <CardBody><ol className={styles.activityList}>{activity.map(([title, detail, date]) => <li key={title}><BadgeCheck size={17} aria-hidden="true" /><div><strong>{title}</strong><span>{detail}</span><small>{date}</small></div></li>)}</ol></CardBody>
          </Card>
          <Card tone="outlined" className={styles.quickCard}>
            <CardHeader><div><p className={styles.sectionEyebrow}>Gestion</p><h2>Actions frequentes</h2></div></CardHeader>
            <CardBody><ButtonLink href="#requests" variant="ghost"><FileWarning size={17} aria-hidden="true" />Verifier les documents<ChevronRight size={15} aria-hidden="true" /></ButtonLink><ButtonLink href="#kpis" variant="ghost"><UsersRound size={17} aria-hidden="true" />Voir les nouvelles inscriptions<ChevronRight size={15} aria-hidden="true" /></ButtonLink></CardBody>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, trend, detail, warning = false }: { icon: ReactNode; label: string; value: string; trend: string; detail: string; warning?: boolean }) {
  return <article className={styles.metric}><span className={warning ? styles.metricIconWarning : styles.metricIcon} aria-hidden="true">{icon}</span><p>{label}</p><strong>{value}</strong><div><span className={warning ? styles.warningText : styles.successText}>{trend}</span><small>{detail}</small></div></article>;
}
