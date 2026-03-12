import type { ReactNode } from "react";
import { Topbar } from "../Topbar";
import { StatsWidget } from "../StatsWidget";
import { QuickActions } from "../QuickActions";
import { Card, CardBody } from "@/components/ui/Card";
import type { DashboardPersona, DashboardQuickAction, DashboardStatItem } from "../types";
import styles from "./SectionShell.module.scss";

interface DashboardSectionShellProps {
  persona: DashboardPersona;
  title: string;
  subtitle: string;
  stats?: DashboardStatItem[];
  actions?: DashboardQuickAction[];
  children: ReactNode;
}

export function DashboardSectionShell({
  persona,
  title,
  subtitle,
  stats,
  actions,
  children,
}: DashboardSectionShellProps) {
  return (
    <div className={styles.shell}>
      <Topbar persona={persona} title={title} subtitle={subtitle} />
      {stats && stats.length > 0 ? <StatsWidget items={stats} /> : null}
      {actions && actions.length > 0 ? <QuickActions actions={actions} /> : null}
      <section className={styles.content}>
        <Card className={styles.contentCard}>
          <CardBody className={styles.contentBody}>{children}</CardBody>
        </Card>
      </section>
    </div>
  );
}
