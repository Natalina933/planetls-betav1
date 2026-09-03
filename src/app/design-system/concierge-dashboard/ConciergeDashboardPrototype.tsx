"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Home,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import { AsyncState, Badge, Button, ButtonLink, Card, CardBody, CardHeader, DataTable, Input, Select, StatsCard, TableFilters } from "@/components/ui";
import styles from "./page.module.scss";

type DemoState = "ready" | "loading" | "empty" | "error";

const DEMO_MISSIONS = [
  { time: "09:30", title: "Check-in Villa Azur", place: "Biarritz", status: "A confirmer", tone: "warning" as const },
  { time: "11:00", title: "Controle linge", place: "Le Petit Prince", status: "Planifiee", tone: "info" as const },
  { time: "15:30", title: "Depannage serrure", place: "Maison Larralde", status: "Urgente", tone: "danger" as const },
] as const;

const COMPARISON_ROWS = [
  ["Accueil et KPI", "Cockpit adapte au mode et aux donnees reelles", "Conserver la priorite du jour, harmoniser les cartes KPI", "Conservation + harmonisation visuelle", "Faible"],
  ["Radar et alertes", "Liste issue des demandes, messages et validations", "Regrouper par action attendue avant les indicateurs secondaires", "Amelioration UX", "Moyen"],
  ["Missions et planning", "Liens vers planning, missions et demandes", "Faire du planning du jour la lecture principale", "Conservation + amelioration UX", "Faible"],
  ["Personnalisation", "Widgets et mode co-hote sauvegardes localement", "Conserver le comportement, expliciter les reglages", "Dette technique", "Moyen"],
  ["Bibliotheque inspiration", "Videos et recherches YouTube du profil concierge", "Garder hors du cockpit prioritaire et hors moodboard interne", "Decision produit necessaire", "Moyen"],
  ["Tableaux et mobile", "Cartes et listes locales, styles Dashboard.module.scss", "Utiliser Card, Badge et defilement horizontal lorsque necessaire", "Correction responsive", "Faible"],
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

  const showNotice = (label: string) => setNotice(`${label} est une action de demonstration.`);
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
      <header className={styles.topbar}>
        <Link href="/design-system" className={styles.backLink}>Design System</Link>
        <span>Prototype concierge - donnees de demonstration, aucune action metier</span>
      </header>

      <section className={styles.hero} aria-labelledby="concierge-prototype-title">
        <div>
          <p className={styles.eyebrow}>Page temoin concierge</p>
          <h1 id="concierge-prototype-title">La journee doit se lire en un regard.</h1>
          <p>
            Une proposition de structure pour prioriser l&apos;urgent, les interventions du jour et les actions a effectuer,
            sans remplacer le cockpit metier <code>/dashboard/concierge</code>.
          </p>
        </div>
        <div className={styles.heroActions}>
          <ButtonLink href="/dashboard/concierge" variant="outline">Voir le dashboard reel <ArrowRight size={16} /></ButtonLink>
          <Badge variant="progress">Prototype isolé</Badge>
        </div>
      </section>

      <section className={styles.demoControls} aria-label="Etats de demonstration">
        <div>
          <strong>Etats du referentiel</strong>
          <span>Ces controles existent uniquement pour verifier les etats de presentation.</span>
        </div>
        <div className={styles.stateButtons}>
          {(["ready", "loading", "empty", "error"] as const).map((value) => (
            <Button
              key={value}
              variant={state === value ? "primary" : "outline"}
              size="sm"
              aria-pressed={state === value}
              onClick={() => setState(value)}
            >
              {{ ready: "Vue active", loading: "Chargement", empty: "Vide", error: "Erreur" }[value]}
            </Button>
          ))}
        </div>
      </section>

      <AsyncState
        loading={state === "loading"}
        isEmpty={state === "empty"}
        error={state === "error" ? "Les donnees de demonstration ne sont pas disponibles. Reessayez ou revenez a la vue active." : null}
        loadingLabel="Preparation de la journee de demonstration..."
        emptyLabel="Aucune mission ni action a traiter dans cette simulation."
      >
        <section className={styles.kpis} aria-label="Indicateurs de demonstration">
          <StatsCard label="Interventions du jour" value="3" hint="1 urgence a traiter" trend="Priorite" progress={72} visual={<CalendarClock size={25} />} visualLabel="Planning" />
          <StatsCard label="Demandes a repondre" value="2" hint="Avant midi pour tenir le rythme" trend="A suivre" progress={48} visual={<MessageSquareText size={25} />} visualLabel="Demandes" />
          <StatsCard label="Logements suivis" value="12" hint="10 prets, 2 a verifier" trend="Parc" progress={83} visual={<Home size={25} />} visualLabel="Logements" />
          <StatsCard label="Devis a envoyer" value="1" hint="Opportunite en attente" trend="Action" progress={25} visual={<ClipboardList size={25} />} visualLabel="Devis" />
        </section>

        <section className={styles.dashboardGrid}>
          <div className={styles.mainColumn}>
            <Card tone="soft" className={styles.priorityCard}>
              <CardHeader>
                <div>
                  <p className={styles.sectionEyebrow}>A traiter maintenant</p>
                  <h2>Priorite du jour</h2>
                </div>
                <Badge variant="danger">Urgent</Badge>
              </CardHeader>
              <CardBody>
                <div className={styles.priorityContent}>
                  <span className={styles.priorityIcon}><AlertTriangle size={24} aria-hidden="true" /></span>
                  <div>
                    <strong>Depannage serrure avant l&apos;arrivee</strong>
                    <p>Maison Larralde, Biarritz. Un voyageur arrive a 16:00 et une confirmation terrain est attendue.</p>
                    <div className={styles.metaRow}><span><Clock3 size={14} /> Avant 15:30</span><span><Wrench size={14} /> Artisan a coordonner</span></div>
                  </div>
                </div>
                <div className={styles.actionRow}>
                  <Button onClick={() => showNotice("Ouvrir la mission")}>Ouvrir la mission</Button>
                  <Button variant="outline" onClick={() => showNotice("Contacter l'artisan")}>Contacter l&apos;artisan</Button>
                </div>
              </CardBody>
            </Card>

            <Card className={styles.missionsCard}>
              <CardHeader>
                <div><p className={styles.sectionEyebrow}>Planning</p><h2>Interventions aujourd&apos;hui</h2></div>
                <Button variant="ghost" size="sm" onClick={() => showNotice("Voir le planning complet")}>Planning complet <ArrowRight size={15} /></Button>
              </CardHeader>
              <CardBody>
                <TableFilters
                  resultCount={filteredMissions.length}
                  activeCount={activeMissionFilters}
                  onReset={() => { setMissionQuery(""); setMissionStatus("all"); }}
                >
                  <Input bare value={missionQuery} onChange={(event) => setMissionQuery(event.target.value)} placeholder="Rechercher une mission" aria-label="Rechercher une mission" />
                  <Select bare value={missionStatus} onChange={(event) => setMissionStatus(event.target.value)} aria-label="Filtrer les missions par statut">
                    <option value="all">Tous les statuts</option>
                    <option value="warning">A confirmer</option>
                    <option value="info">Planifiees</option>
                    <option value="danger">Urgentes</option>
                  </Select>
                </TableFilters>
                <DataTable
                  caption="Exemple de lecture priorisee des missions du jour. Donnees de demonstration."
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
            <Card tone="dark" className={styles.alertCard}>
              <CardBody>
                <CheckCircle2 size={22} aria-hidden="true" />
                <p>Cadence du jour</p>
                <strong>2 actions attendent une reponse et 1 intervention doit etre securisee.</strong>
                <Button variant="paper" onClick={() => showNotice("Afficher les alertes")}>Afficher les alertes</Button>
              </CardBody>
            </Card>
            <Card tone="outlined" className={styles.scheduleCard}>
              <CardHeader><div><p className={styles.sectionEyebrow}>Suite de journee</p><h2>Repere planning</h2></div></CardHeader>
              <CardBody>
                <ol>
                  <li><time>11:00</time><span>Controle linge avant check-in</span></li>
                  <li><time>15:30</time><span>Validation depannage serrure</span></li>
                  <li><time>16:00</time><span>Arrivee voyageur a confirmer</span></li>
                </ol>
              </CardBody>
            </Card>
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
      </AsyncState>

      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

      <section className={styles.comparison} aria-labelledby="comparison-title">
        <div className={styles.comparisonHeading}>
          <div><p className={styles.eyebrow}>Matrice existant vers prototype</p><h2 id="comparison-title">Ce qui est conserve et ce qui reste a decider</h2></div>
          <Sparkles size={22} aria-hidden="true" />
        </div>
        <div className={styles.tableWrap}>
          <table>
            <caption>Audit de transition : la page reelle garde son comportement, le prototype ne propose qu'une hierarchie visuelle.</caption>
            <thead><tr><th scope="col">Section actuelle</th><th scope="col">Objectif / composant actuel</th><th scope="col">Evolution proposee</th><th scope="col">Classement</th><th scope="col">Risque</th></tr></thead>
            <tbody>{COMPARISON_ROWS.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
