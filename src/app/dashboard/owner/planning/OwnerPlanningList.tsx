import Link from "next/link";
import { CalendarCheck, Home, UserRound } from "lucide-react";
import {
  formatPlanningDate,
  formatPlanningTime,
  planningStatusLabels,
  planningTypeLabels,
} from "./planningLabels";
import type { OwnerPlanningItem } from "./types";
import styles from "./OwnerPlanningList.module.scss";

type PlanningViewMode = "jour" | "semaine" | "mois";

type OwnerPlanningListProps = {
  items: OwnerPlanningItem[];
  viewMode: PlanningViewMode;
  selectedMonth: string;
};

function isSameDay(value: string, date: Date) {
  const itemDate = new Date(value);
  return (
    itemDate.getFullYear() === date.getFullYear() &&
    itemDate.getMonth() === date.getMonth() &&
    itemDate.getDate() === date.getDate()
  );
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getSelectedMonthDate(selectedMonth: string) {
  const [year, month] = selectedMonth.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1);
}

function getMonthGrid(selectedMonth: string) {
  const monthDate = getSelectedMonthDate(selectedMonth);
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = getWeekStart(firstDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      key: date.toISOString(),
      date,
      isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function getWeekDays() {
  const start = getWeekStart(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      key: date.toISOString(),
      date,
    };
  });
}

function formatMonthTitle(selectedMonth: string) {
  const title = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(getSelectedMonthDate(selectedMonth));
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function getItemsForDay(items: OwnerPlanningItem[], date: Date) {
  return items
    .filter((item) => isSameDay(item.date, date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function renderStatus(item: OwnerPlanningItem) {
  return <span className={`${styles.status} ${styles[item.status]}`}>{planningStatusLabels[item.status]}</span>;
}

function renderEventPill(item: OwnerPlanningItem, compact = false) {
  return (
    <Link
      key={item.id}
      href={`/dashboard/owner/missions/${item.id}`}
      className={`${styles.eventPill} ${styles[item.status]} ${compact ? styles.eventPillCompact : ""}`}
    >
      <span>
        {formatPlanningTime(item.date)} · {planningTypeLabels[item.type]}
      </span>
      <strong>{item.propertyName}</strong>
    </Link>
  );
}

function renderItemCard(item: OwnerPlanningItem) {
  return (
    <article key={item.id} className={styles.itemCard}>
      <div className={styles.dateBlock}>
        <strong>{formatPlanningTime(item.date)}</strong>
        <span>{formatPlanningDate(item.date)}</span>
      </div>
      <div className={styles.mainInfo}>
        {renderStatus(item)}
        <h3>{planningTypeLabels[item.type]}</h3>
        <div className={styles.factGrid}>
          <span>
            <Home size={15} aria-hidden="true" />
            {item.propertyName}
            {item.city ? ` — ${item.city}` : ""}
          </span>
          <span>
            <UserRound size={15} aria-hidden="true" />
            {item.assignedTo || "À assigner"}
          </span>
          <span>
            <CalendarCheck size={15} aria-hidden="true" />
            {planningStatusLabels[item.status]}
          </span>
        </div>
        {item.notes ? <p>{item.notes}</p> : null}
      </div>
      <Link href={`/dashboard/owner/missions/${item.id}`} className={styles.actionLink}>
        Voir
      </Link>
    </article>
  );
}

export default function OwnerPlanningList({ items, viewMode, selectedMonth }: OwnerPlanningListProps) {
  const today = new Date();
  const todayItems = getItemsForDay(items, today);
  const weekDays = getWeekDays();
  const monthDays = getMonthGrid(selectedMonth);
  const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const monthTitle = formatMonthTitle(selectedMonth);
  const monthDate = getSelectedMonthDate(selectedMonth);
  const monthItems = items.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.getFullYear() === monthDate.getFullYear() && itemDate.getMonth() === monthDate.getMonth();
  });
  const headerTitle =
    viewMode === "jour"
      ? "Aujourd'hui"
      : viewMode === "semaine"
        ? "Semaine en cours"
        : `Mois de ${monthTitle}`;

  return (
    <section className={styles.planningList} aria-labelledby="owner-planning-list-title">
      <div className={styles.header}>
        <div>
          <p>Agenda visuel</p>
          <h2 id="owner-planning-list-title">{headerTitle}</h2>
        </div>
        <span>{items.length} élément(s)</span>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Votre planning est calme</h3>
          <p>Aucune mission n'est prévue sur la période sélectionnée.</p>
          <Link href="/dashboard/owner/missions/new">Créer une mission</Link>
        </div>
      ) : null}

      {items.length > 0 && viewMode === "jour" ? (
        <div className={styles.dayAgenda}>
          <aside className={styles.daySummary}>
            <strong>{todayItems.length}</strong>
            <span>mission(s) aujourd'hui</span>
            <p>{todayItems.length > 0 ? "Les actions du jour sont classées par heure." : "Aucune mission prévue aujourd'hui."}</p>
          </aside>
          <div className={styles.dayTimeline}>
            {(todayItems.length > 0 ? todayItems : items.slice(0, 6)).map(renderItemCard)}
          </div>
        </div>
      ) : null}

      {items.length > 0 && viewMode === "semaine" ? (
        <div className={styles.weekAgenda}>
          {weekDays.map((day) => {
            const dayItems = getItemsForDay(items, day.date);
            const label = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).format(day.date);

            return (
              <article key={day.key} className={`${styles.weekColumn} ${isSameDay(day.date.toISOString(), today) ? styles.todayColumn : ""}`}>
                <header>
                  <span>{label}</span>
                  <strong>{dayItems.length}</strong>
                </header>
                <div className={styles.weekEvents}>
                  {dayItems.length > 0 ? dayItems.map((item) => renderEventPill(item)) : <p>Aucune mission</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {items.length > 0 && viewMode === "mois" ? (
        <div className={styles.monthShell}>
          <div className={styles.monthTopline}>
            <div>
              <p>Vue mensuelle</p>
              <h3>{monthTitle}</h3>
            </div>
            <span>{monthItems.length} mission(s) sur ce mois</span>
          </div>

          <div className={styles.monthLegend} aria-label="Légende des statuts">
            <span className={styles.legendUrgent}>Urgent</span>
            <span className={styles.legendWaiting}>À valider</span>
            <span className={styles.legendReady}>Confirmé</span>
          </div>

          <div className={styles.monthAgenda}>
            {weekdayLabels.map((label) => (
              <span key={label} className={styles.weekdayLabel}>
                {label}
              </span>
            ))}
            {monthDays.map((day) => {
              const dayItems = getItemsForDay(items, day.date);

              return (
                <article
                  key={day.key}
                  className={`${styles.monthDay} ${!day.isCurrentMonth ? styles.monthDayMuted : ""} ${
                    isSameDay(day.date.toISOString(), today) ? styles.monthToday : ""
                  } ${dayItems.length > 0 ? styles.monthDayBusy : ""}`}
                >
                  <header>
                    <span className={styles.dayNumber}>{day.date.getDate()}</span>
                    {dayItems.length > 0 ? <strong>{dayItems.length}</strong> : null}
                  </header>
                  <div className={styles.monthEvents}>
                    {dayItems.slice(0, 3).map((item) => renderEventPill(item, true))}
                    {dayItems.length > 3 ? <span className={styles.moreEvents}>+{dayItems.length - 3} autre(s)</span> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
