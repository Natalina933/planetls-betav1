"use client";


import { useState } from "react";
import { PrototypeFrame, PrototypeState, StateControls, type DemoState } from "../_dashboards/PrototypeFrame";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileWarning,
  UsersRound,
} from "lucide-react";
import { Badge, ButtonLink, Card, CardBody, CardHeader } from "@/components/ui";
import styles from "./page.module.scss";
import { RoleFollowUp } from "../_dashboards/RoleFollowUp";
import { RoleContextCard, RoleVisualMetrics } from "../_dashboards/RoleVisualSummary";

const priorities = [
  { title: "3 missions à relire", detail: "Le suivi des interventions attend votre contrôle.", tone: "info" as const, label: "Suivi", action: "Voir les missions", href: "#requests" },
  { title: "7 profils à vérifier", detail: "Les profils attendent une relecture dans le centre de contrôle.", tone: "warning" as const, label: "Attention", action: "Ouvrir le contrôle", href: "#requests" },
  { title: "Activation en hausse", detail: "+12 % de propriétaires actifs sur les 7 derniers jours.", tone: "success" as const, label: "Information", action: "Voir les indicateurs", href: "#kpis" },
];

const activity = [
  ["Nouvelle demande qualifiée", "Lyon 2e - ménage et linge", "Il y a 8 min"],
  ["Mission terminée", "Villa Azur - rapport et photos disponibles", "Il y a 23 min"],
  ["Conciergerie vérifiée", "Maison d'Hôtes & Co", "Il y a 42 min"],
];

export default function AdminDashboardPrototypePage() {
  const [state, setState] = useState<DemoState>("ready");
  return (
    <PrototypeFrame space="admin">
    <main className={styles.page}>

      <section className={styles.pageHeader} aria-labelledby="prototype-title">
        <div>
          <p className={styles.eyebrow}>Centre de pilotage PlanetLS</p>
          <h1 id="prototype-title">Aujourd'hui sur PlanetLS</h1>
          <p className={styles.headerLead}>Les signaux à traiter, l'activité du réseau et les opérations qui demandent votre attention.</p>
        </div>
        <div className={styles.headerMeta}>
          <span>Vue des 30 derniers jours</span>
          <ButtonLink href="#priorities">Traiter les priorités <ArrowUpRight size={16} aria-hidden="true" /></ButtonLink>
        </div>
      </section>

      <StateControls state={state} onChange={setState} />
      <PrototypeState loading={state === "loading"} isEmpty={state === "empty"} error={state === "error" ? "Les données de démonstration sont indisponibles. Réessayez avec la vue active." : null}>
      <p className={styles.calm}>État calme simulé : aucune urgence critique dans cet exemple. Les contrôles ordinaires restent à suivre.</p>
      <RoleVisualMetrics space="admin" />

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <Card id="priorities" className={styles.priorityCard} tone="soft">
            <CardHeader>
              <div><p className={styles.sectionEyebrow}>À traiter maintenant</p><h2>Priorités opérationnelles</h2></div>
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
            <CardHeader><div><p className={styles.sectionEyebrow}>Flux en cours</p><h2>Demandes à suivre</h2></div><ButtonLink href="#requests" variant="ghost">Voir tout</ButtonLink></CardHeader>
            <CardBody>
              <div className={styles.tableWrap}>
                <table>
                  <caption>Les trois demandes les plus importantes à suivre aujourd'hui.</caption>
                  <thead><tr><th scope="col">Demande</th><th scope="col">Zone</th><th scope="col">Statut</th><th scope="col">Prochaine action</th></tr></thead>
                  <tbody>
                    <tr><th scope="row"><strong>Check-in weekend</strong><span>Ref. PL-2048</span></th><td>Biarritz</td><td><Badge variant="warning">En attente</Badge></td><td><ButtonLink href="#requests" variant="ghost" size="sm">Assigner</ButtonLink></td></tr>
                    <tr><th scope="row"><strong>Maintenance climatiseur</strong><span>Ref. PL-2047</span></th><td>Montpellier</td><td><Badge variant="info">À suivre</Badge></td><td><ButtonLink href="#requests" variant="ghost" size="sm">Voir la mission</ButtonLink></td></tr>
                    <tr><th scope="row"><strong>Devis linge saison</strong><span>Ref. PL-2044</span></th><td>Annecy</td><td><Badge variant="info">Devis reçu</Badge></td><td><ButtonLink href="#requests" variant="ghost" size="sm">Vérifier</ButtonLink></td></tr>
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className={styles.sideColumn}>
          <RoleContextCard space="admin" />
          <Card tone="outlined" className={styles.activityCard}>
            <CardHeader><div><p className={styles.sectionEyebrow}>En direct</p><h2>Activité récente</h2></div><Clock3 size={18} aria-hidden="true" /></CardHeader>
            <CardBody><ol className={styles.activityList}>{activity.map(([title, detail, date]) => <li key={title}><BadgeCheck size={17} aria-hidden="true" /><div><strong>{title}</strong><span>{detail}</span><small>{date}</small></div></li>)}</ol></CardBody>
          </Card>
          <Card tone="outlined" className={styles.quickCard}>
            <CardHeader><div><p className={styles.sectionEyebrow}>Gestion</p><h2>Actions fréquentes</h2></div></CardHeader>
            <CardBody><ButtonLink href="#requests" variant="ghost"><FileWarning size={17} aria-hidden="true" />Vérifier les documents<ChevronRight size={15} aria-hidden="true" /></ButtonLink><ButtonLink href="#kpis" variant="ghost"><UsersRound size={17} aria-hidden="true" />Voir les nouvelles inscriptions<ChevronRight size={15} aria-hidden="true" /></ButtonLink></CardBody>
          </Card>
        </aside>
      </section>
      <RoleFollowUp space="admin" />
      </PrototypeState>
    </main>
    </PrototypeFrame>
  );
}
