"use client";

import { useState } from "react";
import { House } from "lucide-react";
import { Alert, AsyncState, Badge, Button, Card, CardBody, Select, Tabs, TabsContent, TabsList, TabsTrigger, type AsyncStateValue } from "@/components/ui";
import { ownerDetail as data } from "./ownerDetailFixtures";
import shared from "./pages.module.scss";
import styles from "./OwnerHousingDetail.module.scss";

type DetailState = "normal" | "loading" | "empty" | "error" | "success" | "incomplete" | "no-reservation";
const states: [DetailState, string][] = [["normal", "Normal"], ["loading", "Chargement"], ["empty", "Vide"], ["error", "Erreur"], ["success", "Succès"], ["incomplete", "Logement incomplet"], ["no-reservation", "Aucune réservation à venir"]];
const tabs = ["Aperçu", "Réservations", "Équipements", "Interventions", "Documents"];

export default function OwnerHousingDetail({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<DetailState>("normal");
  const [tab, setTab] = useState("Aperçu");
  const [notice, setNotice] = useState("");
  const incomplete = state === "incomplete";
  const noReservation = state === "no-reservation";
  const reset = () => { setState("normal"); setTab("Aperçu"); setNotice(""); };
  const asyncState: AsyncStateValue = state === "loading" ? { status: "loading", message: "Chargement de la fiche de démonstration…" }
    : state === "error" ? { status: "error", title: "Erreur technique simulée", message: "La fiche n’a pas pu être chargée. Son état ne peut pas être confirmé.", action: <Button variant="outline" onClick={reset}>Réessayer la fiche</Button> }
    : state === "empty" ? { status: "empty", title: "Aucun logement à présenter", message: "Cette vue de démonstration ne contient aucune fiche.", action: <Button variant="outline" onClick={reset}>Rétablir l’exemple</Button> }
    : { status: "ready" };
  return <section className={`${shared.preview} ${styles.detail}`} data-space="owner" aria-label="Fiche logement Propriétaire">
    <div className={shared.previewTop}><strong>Propriétaire · Détail d’un logement</strong><Select aria-label="État de la fiche" label="État de la fiche" value={state} onChange={event => { setState(event.target.value as DetailState); setTab("Aperçu"); setNotice(""); }}>{states.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
    <div><Button variant="ghost" onClick={onBack}>← Retour à la liste des logements</Button></div>
    <Badge variant="info">Démonstration — données fictives</Badge>
    <AsyncState state={asyncState}>
      <div className={styles.stack}>
        <header className={shared.pageHeader}>
          <div><p>Votre logement, simplement</p><h2>{data.name}</h2><p>{data.location} · localisation fictive</p><Badge variant={incomplete ? "warning" : "success"}>{incomplete ? "Informations à compléter" : "Prêt pour un séjour"}</Badge></div>
          <Button variant="dark" onClick={() => setNotice(incomplete ? "Compléter les consignes : action de démonstration. Aucun formulaire métier n’est ouvert, aucune donnée n’est enregistrée." : "Les consignes de démonstration sont consultables dans l’onglet Aperçu. Aucune donnée n’est enregistrée.")}>{incomplete ? "Compléter les consignes" : "Vérifier les consignes"}</Button>
        </header>
        <section aria-labelledby="housing-next-step"><h3 id="housing-next-step">Votre prochaine étape</h3><p>{incomplete ? "Précisez comment entrer dans le logement pour faciliter l’arrivée. Utilisez le bouton « Compléter les consignes » au-dessus." : "Relisez les consignes d’accès avant le prochain accueil. Utilisez le bouton « Vérifier les consignes » au-dessus."}</p>
          {incomplete && <Alert tone="warning" title="À préparer avant l’accueil">Les consignes d’accès manquent dans cet exemple. La fiche est disponible : il s’agit d’une information à compléter, pas d’une erreur technique.</Alert>}
        </section>
        {notice && <Alert tone="info" title="Consultation simulée" announcement="polite">{notice}</Alert>}
        {state === "success" && <Alert tone="success" title="Confirmation de démonstration" announcement="polite">Les consignes seraient confirmées dans ce scénario. Aucune modification réelle n’a été enregistrée.</Alert>}
        <section className={styles.summary} aria-labelledby="housing-summary">
          <div><h3 id="housing-summary">L’essentiel du logement</h3><dl className={styles.facts}>
            <div><dt>Type</dt><dd>{data.type}</dd></div><div><dt>Capacité</dt><dd>{data.capacity} personnes</dd></div>
            <div><dt>Chambre</dt><dd>{data.bedrooms}</dd></div><div><dt>Surface</dt><dd>{data.area === null ? "Non renseignée" : `${data.area} m²`}</dd></div>
            <div><dt>État général</dt><dd>{incomplete ? "Accès à préciser" : "Préparation à jour dans cet exemple"}</dd></div>
            <div><dt>Prochaine réservation</dt><dd>{noReservation ? "Aucune réservation à venir" : data.reservation.dates}</dd></div>
          </dl></div>
          <figure className={styles.placeholder}><House size={56} aria-hidden="true" /><figcaption>Emplacement photo neutre<br />Aucune photo réelle de logement</figcaption></figure>
        </section>
        <div><p id="housing-tabs-help">Ces onglets affichent des exemples locaux. Ils n’ouvrent aucun dossier réel et ne téléchargent aucun document.</p>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className={styles.tabs} aria-label="Rubriques du logement" aria-describedby="housing-tabs-help">{tabs.map(label => <TabsTrigger key={label} value={label}>{label}</TabsTrigger>)}</TabsList>
            <TabsContent value="Aperçu"><Card className={styles.card} tone="outlined"><CardBody><h3>Préparer un accueil serein</h3><p>Ce logement fictif accueille deux personnes. Retrouvez ici les informations utiles avant leur arrivée.</p><dl className={styles.facts}><div><dt>Arrivée</dt><dd>{data.arrival}</dd></div><div><dt>Consignes d’accès</dt><dd>{incomplete ? "Non renseignées" : "Accueil sur place dans cet exemple, sans code ni adresse réelle."}</dd></div></dl></CardBody></Card></TabsContent>
            <TabsContent value="Réservations"><h3>Prochain séjour</h3>{noReservation ? <Alert tone="info" title="Aucune réservation à venir">Le calendrier fictif ne contient aucun prochain séjour. Cela ne signifie pas que les informations sont indisponibles.</Alert> : <Card className={styles.card} tone="outlined"><CardBody><Badge variant="success">{data.reservation.status}</Badge><p><strong>{data.reservation.dates}</strong></p><p>{data.reservation.description}</p></CardBody></Card>}</TabsContent>
            <TabsContent value="Équipements"><h3>Équipements renseignés</h3><ul className={styles.items}>{data.equipment.map(item => <li key={item}>{item}</li>)}</ul><p>Inventaire fictif à titre de présentation.</p></TabsContent>
            <TabsContent value="Interventions"><h3>Suivi des interventions</h3><ul className={styles.items}>{data.interventions.map(item => <li key={item.id}><strong>{item.title}</strong><p>{item.date}</p><Badge variant={item.status === "Terminée" ? "success" : "info"}>{item.status}</Badge></li>)}</ul></TabsContent>
            <TabsContent value="Documents"><h3>Documents du logement</h3><ul className={styles.items}>{data.documents.map(item => <li key={item.id}><strong>{item.title}</strong><p>{item.description}</p><Badge variant="neutral">Exemple sans téléchargement</Badge></li>)}</ul></TabsContent>
          </Tabs>
        </div>
        <section aria-labelledby="housing-activity"><h3 id="housing-activity">Activité récente fictive</h3><ol className={styles.items}>{data.activity.filter(item => !noReservation || item.date !== "2026-09-06").map(item => <li key={item.date}><time dateTime={item.date}>{item.label}</time><p>{incomplete && item.date === "2026-09-07" ? "Consignes d’arrivée signalées comme manquantes dans cet exemple." : item.event}</p></li>)}</ol></section>
      </div>
    </AsyncState>
  </section>;
}
