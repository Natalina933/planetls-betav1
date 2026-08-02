"use client";

import { useMemo, useState } from "react";
import { Copy, Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { BusinessStrategy, StrategyStatus } from "./types";
import styles from "./BusinessStrategyCenter.module.scss";

export function StrategySelector({ strategies, active, onSelect, onCreate, onDuplicate, onChange }: { strategies: BusinessStrategy[]; active: BusinessStrategy | null; onSelect: (id: string) => void; onCreate: () => void; onDuplicate: (id: string) => void; onChange: (strategy: BusinessStrategy) => void }) {
  const [query, setQuery] = useState("");
  const visibleStrategies = useMemo(() => strategies
    .filter((item) => item.name.toLocaleLowerCase("fr").includes(query.trim().toLocaleLowerCase("fr")))
    .toSorted((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, "fr")), [query, strategies]);
  return <section className={styles.strategyBar}><div><span>Scénario de travail</span><h2>Comparateur de modèles économiques</h2></div><div className={styles.strategyControls}><label><span className="sr-only">Rechercher une stratégie</span><span aria-hidden="true"><Search size={16} /></span><Input aria-label="Rechercher une stratégie" placeholder="Rechercher..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><Select aria-label="Stratégie active" value={active?.id ?? ""} onChange={(e) => onSelect(e.target.value)}><option value="">Choisir une stratégie</option>{visibleStrategies.map((item) => <option key={item.id} value={item.id}>{item.favorite ? "★ " : ""}{item.name}</option>)}</Select><Button variant="outline" onClick={onCreate}><Plus size={16} /> Créer</Button>{active ? <Button variant="ghost" onClick={() => onDuplicate(active.id)}><Copy size={16} /> Dupliquer</Button> : null}</div>{active ? <div className={styles.strategyMeta}><input aria-label="Nom de la stratégie" value={active.name} onChange={(e) => onChange({ ...active, name: e.target.value })} /><textarea aria-label="Description de la stratégie" placeholder="Décrire l’hypothèse testée..." value={active.description} onChange={(e) => onChange({ ...active, description: e.target.value })} /><Select aria-label="Statut" value={active.status} onChange={(e) => onChange({ ...active, status: e.target.value as StrategyStatus })}><option value="draft">Brouillon</option><option value="testing">À tester</option><option value="active">Active</option><option value="archived">Archivée</option></Select><Button variant={active.favorite ? "primary" : "outline"} onClick={() => onChange({ ...active, favorite: !active.favorite })}><Star size={15} /> Favori</Button></div> : null}</section>;
}