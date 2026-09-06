"use client";

import { useState } from "react";
import { Home, Wrench, ArrowRight } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Input, Select, TableFilters } from "@/components/ui";
import { PrototypeFrame, PrototypeState, StateControls, type DemoState } from "./PrototypeFrame";
import styles from "./prototypes.module.scss";
import { RoleFollowUp } from "./RoleFollowUp";
import { RoleContextCard, RoleVisualMetrics } from "./RoleVisualSummary";

const examples = {
  owner: {
    eyebrow: "Votre logement, simplement", title: "Bonjour Camille, tout est à portée de main.",
    lead: "Vos prochains séjours et les petites décisions qui font avancer votre logement.",
    calm: "Rien d’urgent aujourd’hui", detail: "Votre prochain séjour commence vendredi. Un devis vous attend pour la suite.", action: "Consulter le devis",
    list: "Vos prochains séjours", caption: "Séjours à venir — exemple fictif", label: "Séjour", search: "Rechercher un séjour",
    rows: [{ id: "o1", title: "Séjour de vendredi", place: "Appartement des Halles", date: "11 sept. · 16 h", status: "Confirmé" }, { id: "o2", title: "Séjour de la semaine prochaine", place: "Maison des Pins", date: "14 sept. · 15 h", status: "À confirmer" }],
    recent: [["Devis reçu", "Entretien du jardin · 180 € · à consulter"], ["Demande envoyée", "Préparation du logement · en attente de réponse"]],
  },
  provider: {
    eyebrow: "Votre journée sur le terrain", title: "Bonjour Alex, préparons la prochaine intervention.",
    lead: "Les demandes à lire, les devis à préparer et vos rendez-vous, dans cet ordre.",
    calm: "Votre journée est organisée", detail: "Une demande attend votre réponse. Votre prochaine intervention est prévue à 14 h.", action: "Lire la demande",
    list: "Prochaines interventions", caption: "Interventions planifiées — exemple fictif", label: "Intervention", search: "Rechercher une intervention",
    rows: [{ id: "p1", title: "Réparation de la serrure", place: "Maison Larralde", date: "Aujourd’hui · 14 h", status: "Confirmé" }, { id: "p2", title: "Entretien de la climatisation", place: "Villa Azur", date: "Aujourd’hui · 16 h", status: "Confirmé" }, { id: "p3", title: "Diagnostic plomberie", place: "Maison des Pins", date: "Demain · 9 h", status: "À confirmer" }],
    recent: [["Nouvelle demande reçue", "Diagnostic plomberie · Maison des Pins"], ["Intervention terminée", "Réparation d’un volet · Villa Azur"]],
  },
} as const;

export default function RolePrototype({ space }: { space: "owner" | "provider" }) {
  const data = examples[space];
  const [state, setState] = useState<DemoState>("ready");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const rows = data.rows.filter((row) => `${row.title} ${row.place}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")) && (status === "all" || row.status === status));
  const Icon = space === "owner" ? Home : Wrench;
  const show = (label: string) => setNotice(`${label} — démonstration uniquement, aucune donnée enregistrée.`);
  return <PrototypeFrame space={space}><main className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>{data.eyebrow}</p><h1>{data.title}</h1><p>{data.lead}</p></div><span className={styles.motif} aria-hidden="true"><Icon size={48} /></span></header>
    <StateControls state={state} onChange={(next) => { setState(next); setNotice(""); }} />
    <PrototypeState loading={state === "loading"} isEmpty={state === "empty"} error={state === "error" ? "Les données de démonstration sont indisponibles. Réessayez avec la vue active." : null}>
      <section className={styles.priority} aria-label="Priorité du jour"><div><Badge variant="success">État calme simulé</Badge><h2>{data.calm}</h2><p>{data.detail}</p></div><Button onClick={() => show(data.action)}>{data.action}<ArrowRight size={18} aria-hidden="true" /></Button></section>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <RoleVisualMetrics space={space} />
      <div className={styles.grid}><Card><CardHeader><h2>{data.list}</h2></CardHeader><CardBody>
        <TableFilters resultCount={rows.length} resultLabel={`${rows.length} résultat(s)`} resetLabel="Réinitialiser" activeCount={Number(Boolean(query)) + Number(status !== "all")} onReset={() => { setQuery(""); setStatus("all"); }}>
          <label>Recherche<Input bare aria-label={data.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou logement" /></label>
          <label>Statut<Select bare aria-label="Filtrer par statut" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option><option>Confirmé</option><option>À confirmer</option></Select></label>
        </TableFilters>
        <DataTable caption={data.caption} rows={rows} getRowId={(row) => row.id} responsiveStrategy="cards" emptyLabel="Aucun résultat pour ces filtres." columns={[
          { id: "title", label: data.label, render: (row) => <strong>{row.title}</strong> },
          { id: "place", label: "Logement", render: (row) => row.place },
          { id: "date", label: "Quand", render: (row) => row.date },
          { id: "status", label: "Statut", render: (row) => <Badge variant={row.status === "Confirmé" ? "success" : "warning"}>{row.status}</Badge> },
        ]} renderRowAction={(row) => <Button variant="ghost" aria-label={`Consulter ${row.title}`} onClick={() => show(row.title)}>Consulter</Button>} />
      </CardBody></Card><aside className={styles.secondary}>
        <RoleContextCard space={space} />
        <Card><CardHeader><h2>Activité récente</h2></CardHeader><CardBody><ul className={styles.list}>{data.recent.map(([title,detail]) => <li key={title}><strong>{title}</strong><span>{detail}</span></li>)}</ul></CardBody></Card>
      </aside></div>
      <RoleFollowUp space={space} />
    </PrototypeState>
    <p className={styles.footnote}>Exemples fictifs fondés sur les parcours existants : {space === "owner" ? "logements, missions, séjours, demandes et devis" : "demandes, interventions, devis et messages"}. Les boutons simulent une consultation. Aucun paiement ni changement de statut n’est effectué.</p>
  </main></PrototypeFrame>;
}
