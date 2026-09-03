import type { ReactNode } from "react";
import styles from "./DataTable.module.scss";

export type DataTableColumn<T> = {
  id: string;
  label: string;
  align?: "start" | "center" | "end";
  render: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  caption: string;
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  renderRowAction?: (row: T) => ReactNode;
  emptyLabel?: string;
  responsiveStrategy?: "scroll" | "cards";
};

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  renderRowAction,
  emptyLabel = "Aucun resultat a afficher.",
  responsiveStrategy = "scroll",
}: DataTableProps<T>) {
  const hasActions = Boolean(renderRowAction);

  return (
    <div className={styles.wrap} data-responsive={responsiveStrategy}>
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => <th key={column.id} scope="col" data-align={column.align ?? "start"}>{column.label}</th>)}
            {hasActions ? <th scope="col" data-align="end">Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((column, index) => index === 0 ? (
                <th key={column.id} scope="row" data-label={column.label} data-align={column.align ?? "start"}>{column.render(row)}</th>
              ) : (
                <td key={column.id} data-label={column.label} data-align={column.align ?? "start"}>{column.render(row)}</td>
              ))}
              {hasActions ? <td data-label="Action" data-align="end">{renderRowAction?.(row)}</td> : null}
            </tr>
          )) : (
            <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className={styles.empty}>{emptyLabel}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
