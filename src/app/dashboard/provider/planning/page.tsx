"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../ProviderCrudPage.module.scss";

type ProviderIntervention = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  location_label: string | null;
};

type ProviderInterventionsPayload = {
  items: ProviderIntervention[];
  summary: {
    total: number;
    in_progress: number;
    pending: number;
    completed: number;
  };
  note: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "Non planifie";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ProviderPlanningPage() {
  const [data, setData] = useState<ProviderInterventionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const response = await fetch("/api/provider/interventions", { cache: "no-store" });
        const payload = (await response.json()) as ProviderInterventionsPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger le planning.");
        }
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le planning.");
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = useMemo(() => {
    const rows = data?.items ?? [];
    return [...rows]
      .filter((item) => item.scheduled_start)
      .sort(
        (a, b) =>
          new Date(a.scheduled_start ?? 0).getTime() - new Date(b.scheduled_start ?? 0).getTime(),
      )
      .slice(0, 10);
  }, [data]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return (data?.items ?? []).filter(
      (item) => item.scheduled_start && new Date(item.scheduled_start).toDateString() === today,
    ).length;
  }, [data]);

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Organisation</p>
            <h1>Planning</h1>
            <p>{error || data?.note || "Visualisez les prochaines interventions et les charges a venir."}</p>
          </div>
          <div className={styles.metrics}>
            <span>{data?.summary.total ?? 0} missions</span>
            <span>{todayCount} aujourd&apos;hui</span>
            <span>{data?.summary.in_progress ?? 0} en cours</span>
          </div>
        </header>

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Vue rapide</h2>
            </div>
            <div className={styles.counterRow}>
              <span className={styles.counter}>{upcoming.length} a venir</span>
              <span className={styles.counter}>{(data?.items ?? []).filter((item) => item.priority === "urgent").length} urgentes</span>
              <span className={styles.counter}>{(data?.items ?? []).filter((item) => !item.scheduled_start).length} sans date</span>
            </div>
            <div className={styles.formActions}>
              <Link href="/dashboard/provider/interventions" className={styles.linkButton}>
                Voir les interventions
              </Link>
              <Link href="/dashboard/provider/alertes" className={styles.linkButton}>
                Voir les alertes
              </Link>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Prochaines echeances</h2>
              <span>{upcoming.length} ligne(s)</span>
            </div>
            {upcoming.length === 0 ? (
              <p className={styles.emptyState}>Aucune intervention planifiee pour le moment.</p>
            ) : (
              <div className={styles.cardList}>
                {upcoming.map((item) => (
                  <article key={item.id} className={styles.itemCard}>
                    <div className={styles.itemHead}>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.location_label || "Lieu a confirmer"}</p>
                      </div>
                      <span className={styles.badge}>{item.status || "pending"}</span>
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{formatDateTime(item.scheduled_start)}</span>
                      <span>Fin: {formatDateTime(item.scheduled_end)}</span>
                      <span>Priorite: {item.priority || "normal"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
