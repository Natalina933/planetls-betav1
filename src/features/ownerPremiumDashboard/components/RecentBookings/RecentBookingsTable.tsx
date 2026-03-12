import type { Booking, BookingStatus } from "../../types";
import styles from "./RecentBookingsTable.module.scss";

type RecentBookingsTableProps = {
  rows: Booking[];
};

const statusLabel: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  checked_in: "Checked-in",
  completed: "Completed",
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function RecentBookingsTable({ rows }: RecentBookingsTableProps) {
  return (
    <section className={styles.card} aria-label="Recent bookings table">
      <header className={styles.header}>
        <h2>Recent bookings</h2>
        <button type="button">View all</button>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Property</th>
              <th>Dates</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.guestName}</td>
                <td>{row.property}</td>
                <td>{row.checkIn} - {row.checkOut}</td>
                <td>{formatAmount(row.amount)}</td>
                <td>
                  <span className={`${styles.badge} ${styles[row.status]}`}>{statusLabel[row.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
