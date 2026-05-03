import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./QuickActions.module.scss";
import type { DashboardQuickAction } from "../types";

interface QuickActionsProps {
  actions: DashboardQuickAction[];
  title?: string;
  eyebrow?: string;
  showHeader?: boolean;
}

export function QuickActions({
  actions,
  title = "Faire maintenant",
  eyebrow = "Actions rapides",
  showHeader = true,
}: QuickActionsProps) {
  return (
    <Card className={styles.card}>
      {showHeader ? (
        <CardHeader className={styles.header}>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </CardHeader>
      ) : null}
      <CardBody className={styles.body}>
        {actions.map((action, index) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={`${styles.action} ${index === 0 ? styles.actionPrimary : ""}`}
          >
            <span className={styles.actionTopline}>{action.badge ?? `Etape ${index + 1}`}</span>
            <strong>{action.label}</strong>
            {action.description ? <span className={styles.actionDescription}>{action.description}</span> : null}
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}
