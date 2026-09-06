"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Home,
  Plus,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Input, Select, TableFilters } from "@/components/ui";
import { PrototypeState as AsyncState, StateControls } from "../_dashboards/PrototypeFrame";
import styles from "./page.module.scss";
import { RoleFollowUp } from "../_dashboards/RoleFollowUp";
import { RoleContextCard, RoleVisualMetrics } from "../_dashboards/RoleVisualSummary";
import { ArtDecoLiveDashboard } from "@/components/ui/ArtDecoWorkspace/ArtDecoWorkspace";

type DemoState = "ready" | "loading" | "empty" | "error";

const DEMO_MISSIONS = [
  { time: "09:30", title: "Check-in Villa Azur", place: "Biarritz", status: "À confirmer", tone: "warning" as const },
  { time: "11:00", title: "Contrôle linge", place: "Le Petit Prince", status: "Planifiée", tone: "info" as const },
  { time: "15:30", title: "Dépannage serrure", place: "Maison Larralde", status: "Urgente", tone: "danger" as const },
] as const;

const COMPARISON_ROWS = [
  ["Accueil et KPI", "Cockpit adapté au mode et aux données réelles", "Conserver la priorité du jour, harmoniser les cartes KPI", "Conservation + harmonisation visuelle", "Faible"],
  ["Radar et alertes", "Liste issue des demandes, messages et validations", "Regrouper par action attendue avant les indicateurs secondaires", "Amélioration UX", "Moyen"],
  ["Missions et planning", "Liens vers planning, missions et demandes", "Faire du planning du jour la lecture principale", "Conservation + amélioration UX", "Faible"],
  ["Personnalisation", "Widgets et mode co-hôte sauvegardés localement", "Conserver le comportement, expliciter les réglages", "Dette technique", "Moyen"],
  ["Bibliothèque inspiration", "Vidéos et recherches YouTube du profil concierge", "Garder hors du cockpit prioritaire et hors moodboard interne", "Décision produit nécessaire", "Moyen"],
  ["Tableaux et mobile", "Cartes et listes locales, styles Dashboard.module.scss", "Utiliser Card, Badge et défilement horizontal lorsque nécessaire", "Correction responsive", "Faible"],
] as const;

const MISSION_COLUMNS = [
  { id: "time", label: "Heure", render: (mission: (typeof DEMO_MISSIONS)[number]) => mission.time },
  { id: "title", label: "Intervention", render: (mission: (typeof DEMO_MISSIONS)[number]) => <strong>{mission.title}</strong> },
  { id: "place", label: "Logement", render: (mission: (typeof DEMO_MISSIONS)[number]) => mission.place },
  { id: "status", label: "Statut", render: (mission: (typeof DEMO_MISSIONS)[number]) => <Badge variant={mission.tone}>{mission.status}</Badge> },
] as const;

export default function ConciergeDashboardPrototype() {
  const [state, setState] = useState<DemoState>("ready");
  const [notice, setNotice] = useState("");
  const [missionQuery, setMissionQuery] = useState("");
  const [missionStatus, setMissionStatus] = useState("all");

  const showNotice = (label: string) => setNotice(`${label} est une action de démonstration.`);
  const filteredMissions = useMemo(() => {
    const query = missionQuery.trim().toLowerCase();
    return DEMO_MISSIONS.filter((mission) => {
      const matchesQuery = !query || `${mission.title} ${mission.place}`.toLowerCase().includes(query);
      return matchesQuery && (missionStatus === "all" || mission.tone === missionStatus);
    });
  }, [missionQuery, missionStatus]);
  const activeMissionFilters = Number(Boolean(missionQuery.trim())) + Number(missionStatus !== "all");

  return (
    <main className={styles.page}>

      <section className={styles.hero} aria-labelledby="concierge-prototype-title">
        <div>
          <p className={styles.eyebrow}>Page témoin concierge</p>
          <h1 id="concierge-prototype-title">La journée doit se lire en un regard.</h1>
          <p>
            Vos urgences, missions et rendez-vous du jour.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Badge variant="progress">Prototype isolé</Badge>
        </div>
      </section>

      <StateControls state={state} onChange={(next) => { setState(next); setNotice(""); }} />

      <AsyncState
        loading={state === "loading"}
        isEmpty={state === "empty"}
        error={state === "error" ? "Les données de démonstration ne sont pas disponibles. Réessayez ou revenez à la vue active." : null}
        loadingLabel="Préparation de la journée de démonstration..."
        emptyLabel="Aucune mission ni action à traiter dans cette simulation."
      >
            <Card tone="soft" className={styles.priorityCard}>
              <CardHeader>
                <div>
                  <p className={styles.sectionEyebrow}>À traiter maintenant</p>
                  <h2>Priorité du jour</h2>
                </div>
                <Badge variant="danger">Urgence simulée</Badge>
              </CardHeader>
              <CardBody>
                <div className={styles.priorityContent}>
                  <span className={styles.priorityIcon}><AlertTriangle size={24} aria-hidden="true" /></span>
                  <div>
                    <strong>Dépannage serrure avant l&apos;arrivée</strong>
                    <p>Maison Larralde. Arrivée à 16 h ; confirmation terrain attendue avant 15 h 30.</p>
                    <div className={styles.metaRow}><span><Clock3 size={14} /> Avant 15:30</span><span><Wrench size={14} /> Artisan à coordonner</span></div>
                  </div>
                </div>
                <div className={styles.actionRow}>
                  <Button onClick={() => showNotice("Ouvrir la mission")}>Ouvrir la mission</Button>
                </div>
              </CardBody>
            </Card>

        <ArtDecoLiveDashboard metrics={[
          { label: "Interventions du jour", value: "3", icon: "missions" },
          { label: "Demandes à traiter", value: "2", icon: "quote" },
          { label: "Logements suivis", value: "12", icon: "homes" },
          { label: "Devis à envoyer", value: "1", icon: "quote" },
        ]} detail="Trois passages prévus ; priorité à la serrure avant l’arrivée. Ordre indicatif, aucun trajet calculé." />
        <RoleVisualMetrics space="concierge" />

        <section className={styles.dashboardGrid}>
          <div className={styles.mainColumn}>
            <Card className={styles.missionsCard}>
              <CardHeader>
                <div><p className={styles.sectionEyebrow}>Planning</p><h2>Interventions aujourd&apos;hui</h2></div>
                <Button variant="ghost" size="sm" onClick={() => showNotice("Voir le planning complet")}>Planning complet <ArrowRight size={15} /></Button>
              </CardHeader>
              <CardBody>
                <TableFilters
                  resultCount={filteredMissions.length}
                  resultLabel={`${filteredMissions.length} résultat(s)`}
                  resetLabel="Réinitialiser"
                  activeCount={activeMissionFilters}
                  onReset={() => { setMissionQuery(""); setMissionStatus("all"); }}
                >
                  <Input bare value={missionQuery} onChange={(event) => setMissionQuery(event.target.value)} placeholder="Rechercher une mission" aria-label="Rechercher une mission" />
                  <Select bare value={missionStatus} onChange={(event) => setMissionStatus(event.target.value)} aria-label="Filtrer les missions par statut">
                    <option value="all">Tous les statuts</option>
                    <option value="warning">À confirmer</option>
                    <option value="info">Planifiées</option>
                    <option value="danger">Urgentes</option>
                  </Select>
                </TableFilters>
                <DataTable
                  caption="Exemple de lecture priorisée des missions du jour. Données de démonstration."
                  responsiveStrategy="cards"
                  columns={MISSION_COLUMNS}
                  rows={filteredMissions}
                  getRowId={(mission) => mission.title}
                  renderRowAction={(mission) => <Button variant="ghost" size="sm" onClick={() => showNotice(`Consulter ${mission.title}`)}>Consulter</Button>}
                  emptyLabel="Aucune mission ne correspond aux filtres actifs."
                />
              </CardBody>
            </Card>
          </div>

          <aside className={styles.sideColumn}>
            <RoleContextCard space="concierge" />
            <Card tone="outlined" className={styles.quickActions}>
              <CardHeader><div><p className={styles.sectionEyebrow}>Actions rapides</p><h2>Créer ou relancer</h2></div></CardHeader>
              <CardBody>
                <Button variant="ghost" onClick={() => showNotice("Créer une mission")}><Plus size={16} /> Créer une mission</Button>
                <Button variant="ghost" onClick={() => showNotice("Envoyer un message")}><Send size={16} /> Envoyer un message</Button>
                <Button variant="ghost" onClick={() => showNotice("Ajouter un logement")}><Home size={16} /> Ajouter un logement</Button>
              </CardBody>
            </Card>
          </aside>
        </section>
        <RoleFollowUp space="concierge" />
      </AsyncState>

      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

      <section className={styles.comparison} aria-labelledby="comparison-title">
        <div className={styles.comparisonHeading}>
          <div><p className={styles.eyebrow}>Matrice existant vers prototype</p><h2 id="comparison-title">Ce qui est conservé et ce qui reste à décider</h2></div>
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div className={styles.tableWrap}>
          <table>
            <caption>Audit de transition : la page réelle garde son comportement, le prototype ne propose qu'une hierarchie visuelle.</caption>
            <thead><tr><th scope="col">Section actuelle</th><th scope="col">Objectif / composant actuel</th><th scope="col">Évolution proposée</th><th scope="col">Classement</th><th scope="col">Risque</th></tr></thead>
            <tbody>{COMPARISON_ROWS.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
