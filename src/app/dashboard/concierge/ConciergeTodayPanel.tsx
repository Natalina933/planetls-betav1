"use client";

import Link from "next/link";
import { CalendarCheck, MapPin, MessageSquare, PackagePlus, UsersRound } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import { formatDateValue } from "@/app/utils/formatters";
import type { ConciergeOwnerMatch } from "./dashboardClient";
import styles from "./ConciergeTodayPanel.module.scss";

type TodayEvent = {
  title?: unknown;
  start: Date;
};

type ConciergeTodayPanelProps = {
  events: TodayEvent[];
  matches: ConciergeOwnerMatch[];
  matchesLoading: boolean;
  matchesError: string | null;
  maxCards?: number;
};

export default function ConciergeTodayPanel({
  events,
  matches,
  matchesLoading,
  matchesError,
  maxCards = 3,
}: ConciergeTodayPanelProps) {
  const nextEvent = events[0] ?? null;
  const nextMatch = matches[0] ?? null;

  const tasks = [
    {
      id: "planning",
      title: nextEvent ? "Confirmer le prochain passage" : "Vérifier le planning",
      detail: nextEvent
        ? `${String(nextEvent.title || "Mission planifiée")} · ${formatDateValue(nextEvent.start, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Aucune mission planifiée proche. Gardez votre disponibilité à jour.",
      href: "/dashboard/concierge/planning",
      icon: CalendarCheck,
      status: nextEvent ? "À traiter" : "Calme",
    },
    {
      id: "local",
      title: nextMatch ? "Contacter un propriétaire proche" : "Affiner ma zone locale",
      detail: matchesError
        ? matchesError
        : matchesLoading
          ? "Recherche de propriétaires compatibles en cours."
          : nextMatch
            ? `${nextMatch.title} · ${nextMatch.city ?? "Ville non renseignée"}${
                typeof nextMatch.distance_km === "number" ? ` · ${nextMatch.distance_km} km` : ""
              }`
            : "Aucun contact chaud pour le moment. Zone et services restent vos meilleurs leviers.",
      href: nextMatch ? "/dashboard/concierge/recherche" : "/dashboard/concierge/profile?tab=missions",
      icon: MapPin,
      status: nextMatch ? `${nextMatch.compatibility_score}%` : "À jour",
    },
    {
      id: "messages",
      title: "Préparer une réponse type",
      detail: "Gardez un message court prêt pour les demandes de ménage, accueil ou intervention.",
      href: "/dashboard/concierge/contract-templates",
      icon: MessageSquare,
      status: "5 min",
    },
    {
      id: "packs",
      title: "Créer un pack clair",
      detail: "Regroupez accueil, ménage ou linge dans une offre simple à réutiliser.",
      href: "/dashboard/concierge/services-packages",
      icon: PackagePlus,
      status: "Expert",
    },
    {
      id: "owners",
      title: "Inviter un propriétaire",
      detail: "Ajoutez un contact existant pour centraliser les échanges et les biens.",
      href: "/dashboard/concierge/contacts",
      icon: UsersRound,
      status: "Expert",
    },
  ].slice(0, maxCards);

  return (
    <DashboardPanel title="Aujourd'hui" bodyClassName={styles.body}>
      <div className={styles.taskGrid}>
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link key={task.id} href={task.href} className={styles.taskCard}>
              <span className={styles.taskIcon}>
                <Icon size={18} />
              </span>
              <span className={styles.taskStatus}>{task.status}</span>
              <strong>{task.title}</strong>
              <span>{task.detail}</span>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
