"use client";
import { useState } from "react";
import { Alert, AsyncState, Button, type AsyncStateValue } from "@/components/ui";
import styles from "./SharedStatesShowcase.module.scss";

const examples: { label: string; state: AsyncStateValue }[] = [
  { label: "Disponible", state: { status: "ready" } },
  { label: "Chargement", state: { status: "loading", message: "Chargement des données de démonstration…" } },
  { label: "Erreur", state: { status: "error", message: "Le chargement a échoué. La situation ne peut pas être évaluée." } },
  { label: "Vide", state: { status: "empty", message: "Aucun élément ne correspond aux filtres de démonstration." } },
  { label: "Calme", state: { status: "calm", message: "Les données de démonstration ne signalent aucune urgence." } },
  { label: "Urgent", state: { status: "urgent", message: "Une intervention de démonstration nécessite votre attention." } },
  { label: "Indisponible", state: { status: "unavailable", message: "La source est indisponible. Aucun chiffre ne peut être confirmé." } },
];

export function SharedStatesShowcase() {
  const [selected, setSelected] = useState(0);
  const state = examples[selected].state;
  const action = <Button onClick={() => setSelected(0)}>Réessayer la démonstration</Button>;
  return <section className={styles.showcase} aria-labelledby="shared-states-title">
    <h2 id="shared-states-title">Alertes et états partagés</h2>
    <p>Fixtures uniquement : ces exemples ne consultent aucune donnée réelle.</p>
    <div className={styles.controls} role="group" aria-label="État de démonstration">
      {examples.map((example, index) => <Button key={example.state.status}
        variant={selected === index ? "primary" : "outline"}
        aria-pressed={selected === index} onClick={() => setSelected(index)}>{example.label}</Button>)}
    </div>
    <div data-testid="shared-state-result">
      <AsyncState state={state.status === "error" || state.status === "unavailable" ? { ...state, action } : state}>
        <p>Données chargées : 0 demande en attente (fixture).</p>
      </AsyncState>
    </div>
    <h3>Les quatre niveaux d’alerte</h3>
    <div className={styles.examples}>
      <Alert title="Information" tone="info">Une information utile au parcours.</Alert>
      <Alert title="Confirmation" tone="success">La demande de démonstration a été enregistrée.</Alert>
      <Alert title="Attention" tone="warning">Une vérification est nécessaire.</Alert>
      <Alert title="Erreur" tone="danger">L’opération de démonstration a échoué.</Alert>
    </div>
    <details><summary>Compatibilité avec les états historiques</summary>
      <div data-testid="legacy-loading"><AsyncState loading error="Erreur historique" isEmpty><p>Contenu historique</p></AsyncState></div>
      <div data-testid="legacy-error"><AsyncState error="Erreur historique" isEmpty><p>Contenu historique</p></AsyncState></div>
      <div data-testid="legacy-empty"><AsyncState isEmpty><p>Contenu historique</p></AsyncState></div>
      <div data-testid="legacy-ready"><AsyncState><p>Contenu historique</p></AsyncState></div>
      <div data-testid="explicit-priority"><AsyncState state={{ status: "ready" }} loading error="Erreur historique" isEmpty><p>État explicite prioritaire</p></AsyncState></div>
    </details>
  </section>;
}
