import Image from "next/image";
import { AlertTriangle, CalendarDays, CheckCircle2, FileText, MessageSquareText, ShieldCheck, UsersRound } from "lucide-react";
import { Badge, Card, CardBody, StatsCard } from "@/components/ui";
import DashboardMetricCard from "@/components/ui/dashboard/saas/DashboardMetricCard";
import { getDashboardMissionPaceMeta } from "@/components/ui/dashboard/saas/dashboardMissionPace";
import { MetricDonut } from "@/components/ui/dashboard/MetricDonut/MetricDonut";
import { PROFILE_VISUAL_KITS } from "@/styles/tokens/profileVisualKit";
import type { Space } from "./PrototypeFrame";
import styles from "./RoleVisualSummary.module.scss";

// Fixtures de présentation : les ratios décrivent ces exemples, jamais une activité réelle.
const summaries = {
  owner: {
    cadence: "Missions à venir", count: 3, period: "Sur les 7 prochains jours", messages: 4,
    ratio: { label: "Fiches complètes", count: 1, total: 2, detail: "Logements suivis" },
    decision: { label: "Devis reçus", value: "1", detail: "2 demandes en cours", status: "À consulter" },
    profile: "Camille · propriétaire", context: "Vos logements", detail: "Deux logements, un prochain séjour vendredi.",
    checks: [{ title: "Appartement des Halles", detail: "Séjour confirmé · fiche complète", ready: true }, { title: "Maison des Pins", detail: "Informations à compléter · séjour à confirmer", ready: false }],
  },
  provider: {
    cadence: "Interventions du jour", count: 2, period: "À 14 h puis à 16 h", messages: 3,
    ratio: { label: "Confirmées", count: 2, total: 3, detail: "Interventions à venir" },
    decision: { label: "Devis en attente", value: "2", detail: "1 nouvelle demande à lire", status: "À suivre" },
    profile: "Alex · prestataire", context: "Devis à suivre", detail: "Les propositions à préparer ou à relancer.",
    checks: [{ title: "Remplacement du chauffe-eau", detail: "Brouillon · montant à compléter", ready: false }, { title: "Révision de la climatisation", detail: "Devis envoyé · réponse du client attendue", ready: true }],
  },
  concierge: {
    cadence: "Cadence du jour", count: 3, period: "2 réponses attendues · 1 urgence", messages: 4,
    ratio: { label: "Planifiées", count: 1, total: 3, detail: "Passages du jour" },
    decision: null,
    profile: "Équipe · conciergerie", context: "Coordination terrain", detail: "Les points à sécuriser avant les arrivées.",
    checks: [{ title: "Contrôle linge · 11 h", detail: "Passage planifié au Petit Prince", ready: true }, { title: "Maison Larralde · avant 15 h 30", detail: "Confirmation du dépannage attendue", ready: false }],
  },
  admin: {
    cadence: "Missions en cours", count: 47, period: "Sur l’ensemble du réseau", messages: 4,
    ratio: { label: "Profils à vérifier", count: 7, total: 10, detail: "Contrôles : 7 profils, 3 missions" },
    decision: { label: "Nouveaux comptes", value: "1 284", detail: "+8,2 % sur 30 jours", status: "Réseau" },
    profile: "Équipe · administration", context: "Contrôle du réseau", detail: "386 logements suivis · 24 de plus ce mois-ci.",
    checks: [{ title: "Maison d’Hôtes & Co", detail: "Conciergerie vérifiée dans cet exemple", ready: true }, { title: "Décisions humaines", detail: "7 profils et 3 missions restent à relire", ready: false }],
  },
} as const;

export function RoleVisualMetrics({ space }: { space: Space }) {
  const data = summaries[space];
  const pace = getDashboardMissionPaceMeta(data.count);
  const paceLabel = space === "owner" ? "Activité sur 7 jours" : pace.label;
  const ratio = data.ratio;
  return <section id="kpis" className={styles.metrics} data-role-metrics={space} data-columns={data.decision ? 4 : 3} aria-label="Indicateurs de démonstration">
    <DashboardMetricCard showLabel label={data.cadence} value={space === "concierge" ? "" : String(data.count)} detail={data.period} icon={<CalendarDays size={20} aria-hidden="true" />} statusLabel={paceLabel} statusTone={pace.tone} statusIcon={pace.icon} statusText={paceLabel} />
    <StatsCard label="Messages" value={String(data.messages)} hint="Messages non lus" trend="Info" visual={<MessageSquareText size={30} aria-hidden="true" />} visualLabel="Messagerie" />
    <MetricDonut label={ratio.label} value={`${ratio.count}/${ratio.total}`} detail={ratio.detail} percent={ratio.count / ratio.total * 100} compact />
    {data.decision && <DashboardMetricCard showLabel label={data.decision.label} value={data.decision.value} detail={data.decision.detail} icon={space === "admin" ? <UsersRound size={20} aria-hidden="true" /> : <FileText size={20} aria-hidden="true" />} statusLabel={data.decision.status} statusTone={space === "admin" ? "info" : "warning"} statusIcon={space === "admin" ? <UsersRound size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />} statusText={data.decision.status} />}
  </section>;
}

export function RoleContextCard({ space }: { space: Space }) {
  const data = summaries[space];
  const kit = PROFILE_VISUAL_KITS.find((item) => item.id === space);
  return <Card className={styles.context} tone="soft" data-role-context={space}><CardBody>
    <div className={styles.profileHead}>
      {kit ? <Image src={kit.image} alt="" width={72} height={72} unoptimized /> : <span className={styles.adminIcon}><ShieldCheck size={34} aria-hidden="true" /></span>}
      <div><Badge variant="neutral">{data.profile}</Badge><h2>{data.context}</h2></div>
    </div>
    <p className={styles.detail}>{data.detail}</p>
    <ul className={styles.checklist}>{data.checks.map((item) => <li key={item.title} data-ready={item.ready}>
      {item.ready ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
      <div><strong>{item.title}</strong><span>{item.detail}</span></div>
    </li>)}</ul>
  </CardBody></Card>;
}
