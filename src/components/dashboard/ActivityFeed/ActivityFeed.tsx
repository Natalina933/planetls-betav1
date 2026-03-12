import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./ActivityFeed.module.scss";
import type { DashboardActivityItem } from "../types";

interface ActivityFeedProps {
  items: DashboardActivityItem[];
  title?: string;
}

export function ActivityFeed({ items, title = "Activité récente" }: ActivityFeedProps) {
  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <h2>{title}</h2>
      </CardHeader>
      <CardBody className={styles.body}>
        {items.length === 0 ? <p className={styles.empty}>Aucune activité pour le moment.</p> : null}
        {items.map((item) => (
          <article key={item.id} className={styles.item}>
            <div>
              <h3>{item.title}</h3>
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <div className={styles.meta}>
              {item.dateLabel ? <span>{item.dateLabel}</span> : null}
              {item.href ? <Link href={item.href}>Ouvrir</Link> : null}
            </div>
          </article>
        ))}
      </CardBody>
    </Card>
  );
}
