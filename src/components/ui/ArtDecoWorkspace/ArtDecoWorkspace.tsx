"use client";

import { useId, useState } from "react";
import { BadgeCheck, CalendarCheck, Euro, FileText, Home, MapPin, Route, Search, Sparkles } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import styles from "./ArtDecoWorkspace.module.scss";

type LiveMetric = { label: string; value: string; icon: "money" | "missions" | "homes" | "quote" };
const metricIcons = { money: Euro, missions: CalendarCheck, homes: Home, quote: FileText };

export function ArtDecoLiveDashboard({ metrics, detail }: { metrics: readonly LiveMetric[]; detail: string }) {
  return <section className={styles.live} aria-label="Tableau de bord live" data-live-dashboard data-wide={metrics.length > 2}>
    <header><strong>Tableau de bord live</strong><BadgeCheck size={20} aria-hidden="true" /></header>
    <p className={styles.liveNote}>Aperçu de démonstration</p>
    <div className={styles.metrics}>{metrics.map(metric => { const Icon = metricIcons[metric.icon]; return <article key={metric.label}><Icon size={22} aria-hidden="true" /><strong>{metric.value}</strong><span>{metric.label}</span></article>; })}</div>
    <div className={styles.route}><div className={styles.map} aria-hidden="true"><span className={styles.pinA}>A</span><span className={styles.pinB}>B</span><span className={styles.pinC}>C</span></div><div><Route size={22} aria-hidden="true" /><strong>Tournée à préparer</strong><p>{detail}</p></div></div>
  </section>;
}

export type ArtDecoSearchItem = { id: string; title: string; category: string; place: string; detail: string; meta: string };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();

export function ArtDecoSmartSearch({ scope, items }: { scope: string; items: readonly ArtDecoSearchItem[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const words = normalize(submitted).split(/\s+/).filter(Boolean);
  const results = items.filter(item => words.every(word => normalize(`${item.title} ${item.category} ${item.place} ${item.detail} ${item.meta}`).includes(word)) && normalize(item.place).includes(normalize(place)) && (category === "all" || category === item.category));
  const active = results.find(item => item.id === selected);
  return <section className={styles.panel} aria-labelledby={`${id}-heading`} data-smart-search>
    <header className={styles.header}><div><span className={styles.eyebrow}>Recherche intelligente</span><h3 id={`${id}-heading`} className={styles.title}>Rechercher, filtrer, retrouver</h3></div><Search size={24} aria-hidden="true" /></header>
    <p className={styles.copy}>{scope}</p>
    <form className={styles.searchBar} role="search" aria-label={`Recherche intelligente — ${scope}`} onSubmit={event => { event.preventDefault(); setSubmitted(query); setSelected(null); }}>
      <Search size={20} aria-hidden="true" /><Input bare aria-label="Rechercher dans cet espace" placeholder="Nom, logement, service ou dossier…" value={query} onChange={event => setQuery(event.target.value)} /><Button type="submit" variant="outline">Rechercher</Button>
    </form>
    <div className={styles.searchGrid}>
      <aside className={styles.filters} aria-label="Filtres de recherche"><Input id={`${id}-place`} label="Localisation" placeholder="Toutes les villes" value={place} onChange={event => { setPlace(event.target.value); setSelected(null); }} /><Select id={`${id}-category`} label="Type de résultat" value={category} onChange={event => { setCategory(event.target.value); setSelected(null); }}><option value="all">Tous les types</option>{[...new Set(items.map(item => item.category))].map(value => <option key={value}>{value}</option>)}</Select><Button variant="ghost" onClick={() => { setQuery(""); setSubmitted(""); setPlace(""); setCategory("all"); setSelected(null); }}>Effacer la recherche</Button></aside>
      <div><p className={styles.count} aria-live="polite">{results.length} résultat(s) de démonstration</p><div className={styles.results}>{results.map((item, index) => <article key={item.id} data-selected={selected === item.id}><h4>{item.title}</h4><p><MapPin size={15} aria-hidden="true" />{item.place}</p><span>{item.category}</span><strong>{item.meta}</strong><Button variant="ghost" onClick={() => setSelected(item.id)}>Ouvrir l’aperçu {String.fromCharCode(65 + index)}</Button></article>)}</div>{results.length === 0 && <p>Aucun résultat. Essayez un autre terme ou effacez les filtres.</p>}</div>
      <aside className={styles.mapColumn} aria-label="Repères des résultats"><div className={styles.map}>{results.map((item,index) => <button type="button" key={item.id} className={styles.mapPin} style={{ left: `${20 + (index % 3) * 23}%`, top: `${20 + (index % 3) * 25}%` }} aria-label={`Afficher le repère : ${item.title}`} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{String.fromCharCode(65 + index)}</button>)}</div><p>Repères illustratifs, sans géolocalisation réelle.</p></aside>
    </div>
    {active && <div className={styles.preview} aria-live="polite"><strong>{active.title}</strong><p>{active.detail}</p><p>Aperçu fictif ; aucune action enregistrée.</p></div>}
  </section>;
}

export type ArtDecoQuote = { name: string; price: string; items: readonly string[]; detail: string; action: string };
export function ArtDecoQuotes({ title, options, onAction }: { title: string; options: readonly ArtDecoQuote[]; onAction?: (label: string) => void }) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const selected = options[index];
  if (!selected) return null;
  return <section className={styles.panel} aria-labelledby={`${id}-quotes`} data-dynamic-quotes>
    <header className={styles.header}><div><span className={styles.eyebrow}>Devis dynamique</span><h3 id={`${id}-quotes`} className={styles.title}>{title}</h3></div><Sparkles size={24} aria-hidden="true" /></header>
    <div className={styles.packs} role="group" aria-label={title}>{options.map((option,position) => <article key={option.name} data-selected={index === position}><h4>{option.name}</h4><strong className={styles.price}>{option.price}</strong><ul>{option.items.map(item => <li key={item}>{item}</li>)}</ul><Button variant="outline" aria-pressed={index === position} onClick={() => { setIndex(position); setNotice(""); }}>Voir {option.name}</Button></article>)}</div>
    <div className={styles.offer} data-quote-details><strong>{selected.name} · {selected.price}</strong><p>{selected.detail}</p><Button variant="outline" onClick={() => { if (onAction) onAction(selected.action); else setNotice(`${selected.action} — démonstration, aucun message envoyé ni devis enregistré.`); }}>{selected.action}</Button></div>
    <p className={styles.copy}>Montants et conditions illustratifs. Sélectionner une carte change l’aperçu, sans accepter ni envoyer de devis.</p>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
