"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Alert, AsyncState, Badge, Button, Card, CardBody, Input, Select, TableFilters, DataTable, type AsyncStateValue } from "@/components/ui";
import { examples, models, type Space } from "./fixtures";
import OwnerHousingDetail from "./OwnerHousingDetail";
import atelier from "../atelier.module.scss";
import styles from "./pages.module.scss";

type DemoState = "normal" | "loading" | "empty" | "error" | "success";

export default function PageWorkshop() {
  const [space, setSpace] = useState<Space>("admin");
  const [model, setModel] = useState("Liste");
  const modelRef = useRef<HTMLSelectElement>(null);
  const returnToList = () => { setModel("Liste"); modelRef.current?.focus(); };
  const [width, setWidth] = useState("desktop");
  return <main className={`${atelier.page} ${styles.workshop}`}>
    <header className={atelier.header}>
      <span className={atelier.eyebrow}>Atelier PlanetLS · Pages</span>
      <h1>Une identité, quatre usages</h1>
      <p>Comparez quatre listes et une fiche de logement Propriétaire avant de faire évoluer les pages du site.</p>
      <Badge variant="info">Démonstration — données fictives</Badge>
    </header>
    <div className={styles.controls}>
      <Select aria-label="Espace" label="Espace" value={space} onChange={event => { setSpace(event.target.value as Space); setModel("Liste"); }}>{Object.entries(examples).map(([id, example]) => <option key={id} value={id}>{example.label}</option>)}</Select>
      <Select aria-label="Modèle" label="Modèle" ref={modelRef} value={model} onChange={event => setModel(event.target.value)}>{models.map(([name]) => <option key={name} disabled={name !== "Liste" && !(name === "Fiche" && space === "owner")} value={name}>{name}{name === "Fiche" ? (space === "owner" ? " — logement Propriétaire" : " — Propriétaire uniquement") : name !== "Liste" ? " — à venir" : ""}</option>)}</Select>
      <Select aria-label="Largeur de prévisualisation" label="Largeur de prévisualisation" value={width} onChange={event => setWidth(event.target.value)}><option value="desktop">Ordinateur</option><option value="tablet">Tablette · 768 px</option><option value="mobile">Mobile · 390 px</option></Select>
    </div>
    <p>Les quatre listes et la fiche de logement Propriétaire sont disponibles. La largeur réduit le cadre ; les adaptations mobiles sont vérifiées séparément dans le navigateur.</p>
    <div className={styles.frame} data-width={width}>
      {model === "Fiche" && space === "owner" ? <OwnerHousingDetail onBack={returnToList} /> : <ListPreview key={space} space={space} />}
    </div>
    <section className={styles.notes} aria-labelledby="choices-title">
      <h2 id="choices-title">Pourquoi cette présentation ?</h2>
      <p>{model === "Fiche" ? "La fiche présente d’abord l’action utile et l’essentiel du logement. Les cinq onglets permettent ensuite de consulter les détails sans surcharger la lecture." : examples[space].explanation}</p>
      <p><strong>Composants employés :</strong> {model === "Fiche" ? "Card, CardBody, Badge, Button, Select, Tabs, TabsList, TabsTrigger, TabsContent, AsyncState et Alert. Un emplacement neutre remplace la photo." : "DataTable, TableFilters, Card, CardBody, Badge, Button, Input, Select, AsyncState et Alert."} Les compositions restent réservées à cet atelier.</p>
      <Link href={`/design-system/${space}-dashboard`}>Revoir le prototype d’accueil {examples[space].label}</Link>
      <details><summary>Les six modèles envisagés</summary><dl>{models.map(([name, description]) => <div key={name}><dt>{name}{name === "Liste" ? " · quatre exemples disponibles" : name === "Fiche" ? " · logement Propriétaire disponible" : " · composition proposée"}</dt><dd>{description}</dd></div>)}</dl></details>
    </section>
  </main>;
}

function ListPreview({ space }: { space: Space }) {
  const data = examples[space];
  const [state, setState] = useState<DemoState>("normal");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const rows = data.rows.filter(row => `${row.title} ${row.context} ${row.detail}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")) && (status === "all" || row.status === status));
  const pageCount = Math.max(1, Math.ceil(rows.length / 3));
  const visibleRows = rows.slice((page - 1) * 3, page * 3);
  const reset = () => { setQuery(""); setStatus("all"); setPage(1); setState("normal"); setNotice(""); };
  const asyncState: AsyncStateValue = state === "loading" ? { status: "loading", message: "Chargement de la démonstration…" }
    : state === "error" ? { status: "error", message: "Erreur simulée. Aucune donnée réelle n’est concernée.", action: <Button onClick={reset}>Réessayer</Button> }
    : state === "empty" || rows.length === 0 ? { status: "empty", message: state === "empty" ? data.empty : "Aucun résultat pour ces filtres.", action: <Button onClick={reset}>Afficher tous les exemples</Button> }
    : { status: "ready" };
  const rowAction = (title: string) => setNotice(`${title} : consultation simulée, aucune donnée enregistrée.`);
  return <section className={styles.preview} data-space={space} aria-label={`Prévisualisation ${data.label}`}>
    <div className={styles.previewTop}><strong>PlanetLS · {data.label}</strong><Select aria-label="État présenté" label="État présenté" value={state} onChange={event => { setState(event.target.value as DemoState); setNotice(""); }}>{([["normal", "Normal"], ["loading", "Chargement"], ["empty", "Vide"], ["error", "Erreur"], ["success", "Succès"]] as const).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
    <nav className={styles.localNav} aria-label={`Navigation de démonstration ${data.label}`}>{data.navigation.map((label, index) => <Button key={label} variant="ghost" aria-current={index === 0 ? "page" : undefined} onClick={() => index === 0 ? reset() : setNotice(`${label} : cette page sera étudiée dans une prochaine étape.`)}>{label}</Button>)}</nav>
    <header className={styles.pageHeader}><div><p className={atelier.eyebrow}>{space === "admin" ? "Supervision de la plateforme" : space === "owner" ? "Vos biens, simplement" : "Votre journée sur le terrain"}</p><h2>{data.title}</h2><p>{data.description}</p></div><Button variant="dark" onClick={() => { setStatus(data.rows[0].status); setPage(1); setState("normal"); setNotice(""); }}>{data.action}</Button></header>
    <TableFilters resultCount={state === "empty" ? 0 : rows.length} resultLabel={state === "loading" || state === "error" ? "Résultats indisponibles dans cet état simulé" : `${state === "empty" ? 0 : rows.length} résultat(s)`} resetLabel="Réinitialiser" activeCount={Number(Boolean(query)) + Number(status !== "all")} onReset={reset}>
      <Input label={space === "owner" ? "Rechercher un logement" : "Rechercher"} placeholder={space === "admin" ? "Nom du compte ou espace" : "Un mot dans la liste"} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
      <Select label={space === "owner" ? "État du logement" : "Statut"} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">Tous les statuts</option>{[...new Set(data.rows.map(row => row.status))].map(label => <option key={label}>{label}</option>)}</Select>
    </TableFilters>
    {notice && <Alert tone="info" title="Démonstration" announcement="polite">{notice}</Alert>}
    {state === "success" && <Alert tone="success" title="Action simulée réussie" announcement="polite">Cette confirmation est fictive. Aucune modification n’a été enregistrée.</Alert>}
    <AsyncState state={asyncState}>
      {space === "owner" ? <div className={styles.housingCards}>{visibleRows.map(row => <Card key={row.id} className={styles.housingCard} tone="outlined"><CardBody><Badge variant={row.attention ? "warning" : "success"}>{row.status}</Badge><h3>{row.title}</h3><p>{row.context}</p><p>{row.detail}</p><Button variant="outline" onClick={() => rowAction(row.title)} aria-label={`Consulter ${row.title}`}>Consulter le logement</Button></CardBody></Card>)}</div>
        : <div role="region" aria-label="Résultats de démonstration" tabIndex={0} className={styles.tableRegion}><DataTable caption={`${data.title} — données fictives`} rows={visibleRows} getRowId={row => row.id} responsiveStrategy={space === "admin" ? "scroll" : "cards"} columns={[
          { id: "title", label: data.labels[0], render: row => row.title },
          { id: "context", label: data.labels[1], render: row => row.context },
          { id: "detail", label: data.labels[2], render: row => row.detail },
          { id: "status", label: "Statut", render: row => <Badge variant={row.attention ? "warning" : "success"}>{row.status}</Badge> },
        ]} renderRowAction={row => <Button variant="outline" onClick={() => rowAction(row.title)} aria-label={`${data.rowAction} ${row.title}`}>{data.rowAction}</Button>} /></div>}
      <nav className={styles.pagination} aria-label="Pagination des exemples"><Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button><span aria-live="polite">Page {page} sur {pageCount}</span><Button variant="outline" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Suivant</Button></nav>
    </AsyncState>
  </section>;
}
