"use client";

import type { ReactNode } from "react";
import { Home, Wrench, ShieldCheck, CalendarDays } from "lucide-react";
import { AsyncState, Button, Card, CardBody } from "@/components/ui";
import styles from "./prototypes.module.scss";

export const spaces = [
  { id: "admin", label: "Administrateur", icon: ShieldCheck, detail: "Piloter les opérations", href: "/design-system/admin-dashboard" },
  { id: "owner", label: "Propriétaire", icon: Home, detail: "Prendre soin de son logement", href: "/design-system/owner-dashboard" },
  { id: "concierge", label: "Concierge", icon: CalendarDays, detail: "Organiser la journée", href: "/design-system/concierge-dashboard" },
  { id: "provider", label: "Artisan", icon: Wrench, detail: "Préparer les interventions", href: "/design-system/provider-dashboard" },
] as const;
export type Space = typeof spaces[number]["id"];
export type DemoState = "ready" | "loading" | "empty" | "error";

export function PrototypeFrame({ space, children }: { space: Space; children: ReactNode }) {
  const current = spaces.find((item) => item.id === space)!;
  const Icon = current.icon;
  return <div className={styles.frame} data-space={space}>
    <div id="prototype-content" tabIndex={-1} className={styles.canvas}>
      <div className={styles.ribbon}><span><Icon size={18} aria-hidden="true" /> Espace {current.label.toLowerCase()}</span><span>Prototype • Données fictives • Aucune sauvegarde</span></div>
      {children}
    </div>
  </div>;
}

export function StateControls({ state, onChange }: { state: DemoState; onChange: (state: DemoState) => void }) {
  return <div className={styles.controls} role="group" aria-label="États de démonstration"><span>Tester la présentation</span>{([['ready', 'Vue active'], ['loading', 'Chargement'], ['empty', 'Vide'], ['error', 'Erreur']] as const).map(([value, label]) => <Button key={value} variant="outline" aria-pressed={state === value} onClick={() => onChange(value)}>{label}</Button>)}</div>;
}

export function PrototypeState({ loading, isEmpty, error, loadingLabel = "Chargement de la démonstration…", emptyLabel = "Aucun élément à afficher dans cette simulation.", children }: { loading?: boolean; isEmpty?: boolean; error?: string | null; loadingLabel?: string; emptyLabel?: string; children: ReactNode }) {
  if (error || isEmpty) return <Card><CardBody><div className={styles.state} role={error ? "alert" : "status"}><h2>{error ? "Impossible d’afficher cette vue" : "Rien à afficher pour le moment"}</h2><p>{error || emptyLabel}</p><p>Utilisez « Vue active » pour retrouver l’exemple.</p></div></CardBody></Card>;
  return <AsyncState loading={loading} loadingLabel={loadingLabel}>{children}</AsyncState>;
}
