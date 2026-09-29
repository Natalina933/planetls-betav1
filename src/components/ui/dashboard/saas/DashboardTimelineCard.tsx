"use client";

import { House } from "lucide-react";
import styles from "./DashboardTimelineCard.module.scss";

export type DashboardTimelineStatus = "success" | "active" | "pending" | "warning" | "danger";

export interface DashboardTimelineItem {
  id: string;
  dateLabel?: string;
  date?: string;
  time?: string;
  imageUrl?: string;
  title: string;
  description?: string;
  meta?: string;
  status: DashboardTimelineStatus;
  statusLabel?: string;
}

interface DashboardTimelineCardProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  items: DashboardTimelineItem[];
}

const fallbackStatusLabels: Record<DashboardTimelineStatus, string> = {
  success: "Terminé",
  active: "En cours",
  pending: "À venir",
  warning: "À surveiller",
  danger: "Urgent",
};

const formatDateValue = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    shortDate: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
};

export default function DashboardTimelineCard({ title, actionLabel, onAction, items }: DashboardTimelineCardProps) {
  const titleId = `dashboard-timeline-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h3 className={styles.title} id={titleId}>
          {title}
        </h3>
        {actionLabel ? (
          <button className={styles.action} type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </header>

      <ol className={styles.list}>
        {items.map((item, index) => {
          const formattedDate = formatDateValue(item.date);
          const dateLabel = item.dateLabel ?? "";
          const date = formattedDate?.shortDate ?? item.date ?? "";
          const time = item.time ?? formattedDate?.time ?? "";

          return (
            <li className={styles.item} data-status={item.status} key={item.id}>
              <div className={styles.dateBlock} aria-label={[dateLabel, date, time].filter(Boolean).join(" ")}>
                {dateLabel ? <span>{dateLabel}</span> : null}
                {date ? <strong>{date}</strong> : null}
                {time ? <small>{time}</small> : null}
              </div>
              <span className={styles.rail} aria-hidden="true">
                <span className={styles.dot}>{index + 1}</span>
              </span>
              <span className={styles.thumb} aria-hidden="true">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" />
                ) : (
                  <House size={22} strokeWidth={1.8} />
                )}
              </span>
              <div className={styles.content}>
                <h4 className={styles.itemTitle}>{item.title}</h4>
                {item.description ? <p className={styles.description}>{item.description}</p> : null}
                {item.meta ? <p className={styles.meta}>{item.meta}</p> : null}
              </div>
              <span className={styles.status}>{item.statusLabel ?? fallbackStatusLabels[item.status]}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
