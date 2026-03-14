import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./DashboardPanel.module.scss";

export type DashboardPanelProps = {
  title: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function DashboardPanel({
  title,
  action,
  className = "",
  bodyClassName = "",
  children,
}: DashboardPanelProps) {
  const panelClassName = [styles.panel, className].filter(Boolean).join(" ");
  const panelBodyClassName = [styles.body, bodyClassName].filter(Boolean).join(" ");

  return (
    <Card className={panelClassName}>
      <CardHeader className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {action}
      </CardHeader>
      <CardBody className={panelBodyClassName}>{children}</CardBody>
    </Card>
  );
}
