"use client";

import { useState, type ReactNode } from "react";
import { House, ClipboardCheck, CalendarDays, Users, ArrowRight, Plus } from "lucide-react";
import { Card, Button, ButtonLink, Input } from "@/components/ui";
import type { HousingListItem } from "./HousingListPage";
import styles from "./OwnerHousingOverview.module.scss";

type Props = {
  logements: HousingListItem[];
  total: number;
  reviewCount: number;
  summary: { label: string; value: string; detail: string; percent: number }[];
  loading: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
  addHref: string;
  firstReviewHref: string;
  isReviewMode: boolean;
  onFilter: (value: string) => void;
  renderCards: (items: HousingListItem[]) => ReactNode;
};

const icons=[House,ClipboardCheck,CalendarDays,Users];

export default function OwnerHousingOverview(props:Props) {
  const [search,setSearch]=useState("");
  const normalized=search.trim().toLocaleLowerCase("fr");
  const items=props.logements.filter(item=>`${item.nom_logement} ${item.ville}`.toLocaleLowerCase("fr").includes(normalized));
  return <div className={styles.page} aria-busy={props.loading}>
    <header className={styles.hero}><nav aria-label="Fil d’Ariane">Propriétaire <span aria-hidden="true">›</span> Mes logements</nav><p className={styles.eyebrow}>Votre patrimoine</p><h1>Des logements prêts pour chaque séjour</h1><p>Retrouvez vos biens, leurs informations essentielles et les points à compléter pour préparer les prochains séjours.</p><blockquote>« Des biens d’exception, des revenus durables. »</blockquote></header>
    <section className={styles.metrics} aria-label="Synthèse des logements">{props.summary.map((metric,index)=>{const Icon=icons[index];return <Card key={metric.label} className={styles.metric}><Icon aria-hidden="true"/><div><strong>{props.loading || props.error ? "—":metric.value}</strong><h2>{metric.label}</h2><p>{metric.detail}</p></div></Card>;})}</section>
    <Card className={styles.quickActions}><div><p className={styles.eyebrow}>Actions rapides</p><h2>Faire maintenant</h2></div><ButtonLink href={props.addHref} className={styles.quickAction} variant="secondary"><Plus aria-hidden="true"/><span><small>Votre parc</small>Ajouter un logement</span><ArrowRight aria-hidden="true"/></ButtonLink><ButtonLink href={props.reviewCount ? props.firstReviewHref : "/dashboard/owner/planning"} className={styles.quickAction} variant="secondary"><ClipboardCheck aria-hidden="true"/><span><small>Préparation</small>{props.reviewCount ? "Compléter mes fiches":"Vérifier le planning"}</span><ArrowRight aria-hidden="true"/></ButtonLink></Card>
    <section className={styles.portfolio} aria-labelledby="housing-title"><div className={styles.heading}><div><p className={styles.eyebrow}>Parc propriétaire</p><h2 id="housing-title">{props.isReviewMode ? "Logements à revoir":"Mes logements"}</h2></div><p>{props.loading || props.error ? "—":items.length} logement(s) affiché(s)</p></div>
      <div className={styles.filters}><Input aria-label="Rechercher un logement" placeholder="Rechercher un logement ou une ville…" value={search} onChange={event=>setSearch(event.target.value)}/><ButtonLink href="/dashboard/owner/logements" variant={props.isReviewMode ? "secondary":"primary"} onClick={()=>props.onFilter("")}>Tous</ButtonLink><ButtonLink href="/dashboard/owner/logements?filter=review" variant={props.isReviewMode ? "primary":"secondary"} onClick={()=>props.onFilter("review")}>À revoir ({props.reviewCount})</ButtonLink></div>
      {props.loading ? <p role="status">Chargement des logements...</p> : props.error ? <div className={styles.feedback} role="alert"><p>{props.error}</p><Button onClick={()=>void props.onRetry()} variant="secondary">Réessayer</Button></div> : <>
        {props.total > 0 ? <div className={styles.notice}><ClipboardCheck aria-hidden="true"/><p>{props.reviewCount ? `${props.reviewCount} logement(s) à revoir. Retrouvez les informations manquantes dans chaque fiche.`:"Toutes les fiches contrôlées disposent des informations essentielles."}</p>{props.reviewCount ? <ButtonLink href={props.firstReviewHref} variant="secondary" size="sm">Commencer</ButtonLink>:null}</div>:null}
        {items.length ? <div className={styles.cards}>{props.renderCards(items)}</div> : <div className={styles.empty}><House aria-hidden="true"/><h3>{props.total ? "Aucun logement dans cette vue":"Commencez votre parc"}</h3><p>{props.total ? "Modifiez votre recherche ou consultez tous les logements.":"Ajoutez votre premier logement pour préparer son suivi."}</p><ButtonLink href={props.total ? "/dashboard/owner/logements":props.addHref} variant="secondary" onClick={()=>{setSearch("");props.onFilter("");}}>{props.total ? "Voir tous les logements":"Ajouter mon premier logement"}</ButtonLink></div>}
      </>}
    </section>
    <footer className={styles.footer}><strong>PlanetLS · Mon espace propriétaire</strong><p>Des séjours sereins, des logements qui performent.</p></footer>
  </div>;
}
