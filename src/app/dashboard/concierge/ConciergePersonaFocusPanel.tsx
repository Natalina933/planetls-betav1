"use client";

import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, Eye, MapPinned, Sparkles } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import type { ConciergeDashboardMode } from "./dashboardModes";
import styles from "./ConciergePersonaFocusPanel.module.scss";

type ConciergePersonaFocusPanelProps = {
  mode: ConciergeDashboardMode;
};

export default function ConciergePersonaFocusPanel({ mode }: ConciergePersonaFocusPanelProps) {
  const isEssential = mode === "essential";
  const items = isEssential
    ? [
        {
          icon: CheckCircle2,
          title: "Faire simple aujourd'hui",
          text: "Suivre les missions proches, répondre aux urgences, garder la fiche claire.",
        },
        {
          icon: Eye,
          title: "Lecture confortable",
          text: "Utilisez A+ et le contraste si l'écran devient chargé.",
        },
        {
          icon: MapPinned,
          title: "Rester local",
          text: "Votre zone et votre rayon restent les meilleurs filtres anti-stress.",
        },
      ]
    : [
        {
          icon: BriefcaseBusiness,
          title: "Piloter le portefeuille",
          text: "Suivre biens, offres, propriétaires et relances depuis une vue complète.",
        },
        {
          icon: Sparkles,
          title: "Industrialiser",
          text: "Packs, tarifs, modèles et reporting accélèrent la conversion.",
        },
        {
          icon: MapPinned,
          title: "Développer la zone",
          text: "Utilisez les prospects compatibles pour densifier votre activité.",
        },
      ];

  return (
    <DashboardPanel
      title={isEssential ? "Mode essentiel" : "Mode expert"}
      bodyClassName={styles.body}
      action={
        <Link href="/dashboard/concierge/profile?tab=missions" className={styles.panelAction}>
          Zone
        </Link>
      }
    >
      <div className={styles.focusGrid}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className={styles.focusCard}>
              <span className={styles.icon}>
                <Icon size={30} strokeWidth={2.2} />
              </span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
