"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, MapPin, MessageSquare, PackagePlus, UsersRound } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import { formatDateValue } from "@/app/utils/formatters";
import type { ConciergeOwnerMatch } from "./dashboardClient";
import styles from "./ConciergeTodayPanel.module.scss";

type TodayEvent = {
  title?: unknown;
  start: Date;
};

type ChecklistItemState = {
  task_key: string;
  completed: boolean;
};

type ConciergeTodayPanelProps = {
  events: TodayEvent[];
  matches: ConciergeOwnerMatch[];
  matchesLoading: boolean;
  matchesError: string | null;
  maxCards?: number;
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ConciergeTodayPanel({
  events,
  matches,
  matchesLoading,
  matchesError,
  maxCards = 3,
}: ConciergeTodayPanelProps) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [busyTaskKey, setBusyTaskKey] = useState<string | null>(null);
  const today = useMemo(() => getTodayIsoDate(), []);
  const nextEvent = events[0] ?? null;
  const nextMatch = matches[0] ?? null;

  const tasks = useMemo(
    () =>
      [
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
          href: nextMatch ? "/dashboard/concierge/recherche" : "/dashboard/concierge/fiche",
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
      ].slice(0, maxCards),
    [matchesError, matchesLoading, maxCards, nextEvent, nextMatch],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadChecklist() {
      try {
        const response = await fetch(`/api/concierge/daily-checklist?date=${today}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: ChecklistItemState[] };
        if (cancelled || !Array.isArray(payload.items)) return;

        setChecklist(
          payload.items.reduce<Record<string, boolean>>((acc, item) => {
            acc[item.task_key] = item.completed;
            return acc;
          }, {}),
        );
      } catch {
        // Keep the checklist usable locally even if the API is temporarily unavailable.
      }
    }

    void loadChecklist();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const toggleTask = useCallback(
    async (taskKey: string) => {
      const nextCompleted = !checklist[taskKey];
      setChecklist((current) => ({ ...current, [taskKey]: nextCompleted }));
      setBusyTaskKey(taskKey);

      try {
        const response = await fetch("/api/concierge/daily-checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: today, taskKey, completed: nextCompleted }),
        });
        if (!response.ok) {
          setChecklist((current) => ({ ...current, [taskKey]: !nextCompleted }));
        }
      } catch {
        setChecklist((current) => ({ ...current, [taskKey]: !nextCompleted }));
      } finally {
        setBusyTaskKey(null);
      }
    },
    [checklist, today],
  );

  const completedCount = tasks.filter((task) => checklist[task.id]).length;

  return (
    <DashboardPanel
      title="Aujourd'hui"
      bodyClassName={styles.body}
      action={
        <span className={styles.progressBadge}>
          <CheckCircle2 size={16} aria-hidden="true" />
          {completedCount}/{tasks.length}
        </span>
      }
    >
      <div className={styles.taskGrid}>
        {tasks.map((task) => {
          const Icon = task.icon;
          const completed = Boolean(checklist[task.id]);
          return (
            <article key={task.id} className={`${styles.taskCard} ${completed ? styles.taskCardDone : ""}`}>
              <button
                type="button"
                className={styles.checkButton}
                aria-pressed={completed}
                disabled={busyTaskKey === task.id}
                onClick={() => void toggleTask(task.id)}
              >
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{completed ? "Fait" : "À faire"}</span>
              </button>
              <span className={styles.taskIcon}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className={styles.taskStatus}>{task.status}</span>
              <strong>{task.title}</strong>
              <span>{task.detail}</span>
              <Link href={task.href} className={styles.taskLink}>
                Ouvrir
              </Link>
            </article>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
