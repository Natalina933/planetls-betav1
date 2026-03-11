import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./QuickActions.module.scss";
import type { DashboardQuickAction } from "../types";

interface QuickActionsProps {
  actions: DashboardQuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <h2>Actions rapides</h2>
      </CardHeader>
      <CardBody className={styles.body}>
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className={styles.action}>
            {action.label}
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}
