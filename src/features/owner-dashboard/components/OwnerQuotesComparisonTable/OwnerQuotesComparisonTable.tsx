import type { ReactNode } from "react";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import styles from "./OwnerQuotesComparisonTable.module.scss";

type ComparisonColumn = {
  id: string;
  conciergeName: string;
  status: string | null | undefined;
  badges?: ReactNode;
  total: ReactNode;
  pack: ReactNode;
  services: ReactNode;
  validity: ReactNode;
  responseAt: ReactNode;
  actions?: ReactNode;
};

export type OwnerQuotesComparisonTableProps = {
  columns: ComparisonColumn[];
};

export function OwnerQuotesComparisonTable({ columns }: OwnerQuotesComparisonTableProps) {
  if (columns.length < 2) return null;

  return (
    <div className={styles.scroller}>
      <div
        className={styles.table}
        style={{
          gridTemplateColumns: `minmax(150px, 0.85fr) repeat(${columns.length}, minmax(220px, 1fr))`,
        }}
      >
        <div className={styles.labelCell}>Comparatif</div>
        {columns.map((column) => (
          <div key={`header-${column.id}`} className={styles.valueCell}>
            <div className={styles.headerStack}>
              <strong>{column.conciergeName}</strong>
              <WorkflowStatusBadge value={column.status || "-"} />
              {column.badges ? <div className={styles.badgeRow}>{column.badges}</div> : null}
            </div>
          </div>
        ))}

        <div className={styles.labelCell}>Total</div>
        {columns.map((column) => (
          <div key={`total-${column.id}`} className={styles.valueCell}>
            <strong>{column.total}</strong>
          </div>
        ))}

        <div className={styles.labelCell}>Pack</div>
        {columns.map((column) => (
          <div key={`pack-${column.id}`} className={styles.valueCell}>
            {column.pack}
          </div>
        ))}

        <div className={styles.labelCell}>Prestations</div>
        {columns.map((column) => (
          <div key={`services-${column.id}`} className={styles.valueCell}>
            {column.services}
          </div>
        ))}

        <div className={styles.labelCell}>Validité</div>
        {columns.map((column) => (
          <div key={`validity-${column.id}`} className={styles.valueCell}>
            {column.validity}
          </div>
        ))}

        <div className={styles.labelCell}>Réponse reçue</div>
        {columns.map((column) => (
          <div key={`response-${column.id}`} className={styles.valueCell}>
            {column.responseAt}
          </div>
        ))}

        <div className={styles.labelCell}>Actions</div>
        {columns.map((column) => (
          <div key={`actions-${column.id}`} className={styles.valueCell}>
            {column.actions ? <div className={styles.actions}>{column.actions}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
