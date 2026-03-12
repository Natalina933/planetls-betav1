import type { CalendarReservation } from "../../types";
import styles from "./CalendarWidget.module.scss";

type CalendarWidgetProps = {
  monthLabel: string;
  reservations: CalendarReservation[];
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarWidget({ monthLabel, reservations }: CalendarWidgetProps) {
  const totalDays = 31;

  return (
    <section className={styles.card} aria-label="Reservation calendar widget">
      <header className={styles.header}>
        <h2>Reservation calendar</h2>
        <span>{monthLabel}</span>
      </header>

      <div className={styles.weekDays}>
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from({ length: totalDays }, (_, index) => {
          const dayNumber = index + 1;
          const booked = reservations.find((item) => item.day === dayNumber);

          return (
            <article key={dayNumber} className={`${styles.day} ${booked ? styles.booked : ""}`}>
              <strong>{dayNumber}</strong>
              {booked ? <small>{booked.title}</small> : <small className={styles.empty}>-</small>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
