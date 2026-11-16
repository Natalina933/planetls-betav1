"use client";

import { useState } from "react";
import { Button, Card, CardBody } from "@/components/ui";
import { ASSESSMENT_LABELS, SOCLE_SPACES, summarizeSocle, type SoclePresentation, type SocleSpace } from "./socleProgressData";
import styles from "./page.module.scss";

export const EMPTY_SOCLE: SoclePresentation = { capabilities: [], historicalEvidence: [], securityGates: [], sourceBundles: {}, diagnostic: "Source locale indisponible : indicateurs non évalués." };
const provenance = "Périmètre B3 du 16 novembre 2026 — qualification actuelle non évaluée. Les observations historiques ne constituent pas une validation de fonctionnement réel.";

export function SocleSummary({ data, onFeatures, onChecks }: { data: SoclePresentation; onFeatures: () => void; onChecks: () => void }) {
  const summary = summarizeSocle(data.capabilities);
  return <section className={styles.soclePanel} aria-label="Développement et validation du socle">
    {data.diagnostic ? <p role="status">{data.diagnostic}</p> : null}
    <div className={styles.socleGrid}>
      <Card><CardBody><h2>Développement du socle</h2>
        <p><strong>Non évalué</strong></p>
        <p>{data.diagnostic ? "Recensement indisponible." : `${summary.total} capacités recensées ; 5 améliorations et 2 évolutions futures exclues.`}</p>
        <Button variant="secondary" onClick={onFeatures}>Consulter les capacités</Button>
      </CardBody></Card>
      <Card><CardBody><h2>Validation du socle</h2>
        <p><strong>Non évalué</strong> — preuves actuelles à qualifier.</p>
        <Button variant="secondary" onClick={onChecks}>Consulter les contrôles</Button>
      </CardBody></Card>
    </div>
    <details><summary>Comprendre ces indicateurs</summary><p>{provenance}</p><p>Les états détaillés de PROGRESS-02C1 ne sont pas consignés dans une source locale structurée et reproductible. Aucun pourcentage officiel n’est calculé. Un contrôle non exécuté n’est pas un échec.</p></details>
  </section>;
}

export function SocleExplorer({ data }: { data: SoclePresentation }) {
  const [space, setSpace] = useState<SocleSpace>(SOCLE_SPACES[0]);
  const items = data.capabilities.filter(item => item.scope === "core" && item.spaces.includes(space));
  return <section className={styles.soclePanel} aria-labelledby="socle-capabilities-title">
    <h2 id="socle-capabilities-title">Capacités du socle par espace</h2>
    <label htmlFor="socle-space">Espace métier</label>{" "}
    <select id="socle-space" value={space} onChange={event => setSpace(event.target.value as SocleSpace)}>
      {SOCLE_SPACES.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
    {data.diagnostic ? <p role="status">{data.diagnostic}</p> : <>
      <p aria-live="polite">{items.length} capacités du socle — {space}. {summarizeSocle(data.capabilities, space).counts.not_assessed} non évaluées.</p>
      <div key={space} className={styles.socleList}>
        {items.map(item => <details key={item.id}>
          <summary><strong>{item.id}</strong> — {item.label} · {ASSESSMENT_LABELS[item.development]}</summary>
          <p>Consommateurs explicites : {item.spaces.join(", ")}. Périmètre : socle.</p>
          <p><strong>Développement actuel :</strong> {ASSESSMENT_LABELS[item.development]}. <strong>Validation actuelle :</strong> Non évalué.</p>
          <p><strong>Critères historiques d’implémentation (§5), complétés ou remplacés par B3 ci-dessous :</strong> {item.implementationCriteria}</p>
          <p><strong>Critères historiques de validation, non vérifiés par cette vue :</strong> {item.validationCriteria}</p>
          <p><strong>Observation historique 02B :</strong> {item.qualification}. Cet état ne qualifie pas la cible B3.</p>
          <p><strong>Limites historiques :</strong> {item.limitations}</p>
          {item.obligations.length ? <><h3>Obligations B3 et critères manquants ou à démontrer</h3><ul>{item.obligations.map(row => <li key={row}>{row}</li>)}</ul></> : null}
          <p><strong>Sources :</strong> {item.source} ; référentiel §11 et docs/planetls-progress-launch-arbitration.md §11.</p>
          <p>Sources de code et tests mentionnés par le référentiel (présence déclarée, exécution actuelle non vérifiée) :</p>
          <ul>{item.sourceKeys.map(key => <li key={key}>{key} — {data.sourceBundles[key] ?? "Source indisponible"}</li>)}</ul>
          <p>Les preuves historiques communes sont consultables dans l’onglet Contrôles ; aucune réussite actuelle n’en est déduite pour cette capacité.</p>
        </details>)}
      </div>
      <details><summary>Hors socle : 5 améliorations et 2 évolutions futures</summary>
        <ul>{data.capabilities.filter(item => item.scope !== "core").map(item => <li key={item.id}>{item.id} — {item.label} ({item.scope === "future" ? "Futur" : "Amélioration"})</li>)}</ul>
      </details>
    </>}
  </section>;
}

const validationCategories = [
  ["Tests unitaires", "Tests présents : provider-skills, stay-needs-catalog, quote-send-guard. Exécution actuelle du socle non vérifiée."],
  ["Tests API et handlers", "Tests présents : registration-security, concierge-zone-api, collaboration-termination. Doubles locaux distincts des services réels."],
  ["Tests PostgreSQL/RLS", "Campagnes historiques synthétiques ; accès autorisés, refus inter-rôles/inter-tenants et parcours serveur restent à rattacher aux critères actuels."],
  ["Contrôles de sécurité", "Affectation provider, récupération, sessions, MFA administrateur et confidentialité : garanties de lancement non établies."],
  ["Recettes navigateur", "Scénarios présents dans e2e ; aucune recette opérationnelle actuelle complète des 45 capacités établie."],
  ["Intégrations externes", "Emails essentiels, Storage et circuits financiers : preuves réelles à recueillir ; un aperçu d’email ne prouve pas sa livraison."],
  ["Validation des parcours complets", "Autonomie owner, sollicitation artisan directe/déléguée et règlement contestable : validation B3 non établie."],
] as const;

export function SocleChecks({ data }: { data: SoclePresentation }) {
  return <section className={styles.soclePanel} aria-labelledby="socle-validation-title">
    <h2 id="socle-validation-title">Validation du socle — Non évalué</h2>
    <p>Les preuves actuelles restent à qualifier. Cette page n’exécute aucun test.</p>
    {data.diagnostic ? <p role="status">{data.diagnostic}</p> : null}
    <details><summary>Tests et parcours à vérifier</summary><ul>{validationCategories.map(([label, detail]) => <li key={label}><strong>{label}</strong> — {detail}</li>)}</ul></details>
    <details><summary>Résultats historiques — à requalifier, jamais validés actuellement par défaut</summary>
      <p>Source : docs/planetls-progress-functional-reference.md §3. Dates, environnements et limites conservés ci-dessous ; versions et artefacts à rattacher avant comptage. Aucun classement « obsolète » sans justification.</p>
      {data.historicalEvidence.length ? <ul>{data.historicalEvidence.map(row => <li key={row}>{row}</li>)}</ul> : <p>Preuves historiques indisponibles.</p>}
    </details>
    <details><summary>Contrôles de sécurité restant nécessaires avant lancement</summary>
      <p>Source : docs/planetls-progress-launch-arbitration.md §7. La matrice historique ci-dessous doit être requalifiée selon le §11, qui prévaut : MFA admin, mandat, client contractuel, règlement déclaré/contesté, accès sensibles et emails essentiels. Le contrôle historique de checkout des prestations est remplacé par le suivi du règlement direct ; le multicanal non essentiel reste reporté. Aucun GO bêta ou production.</p>
      {data.securityGates.length ? <ul>{data.securityGates.map(row => <li key={row}>{row}</li>)}</ul> : <p>Matrice de sécurité indisponible.</p>}
    </details>
  </section>;
}
