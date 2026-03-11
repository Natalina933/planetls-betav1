import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./Sidebar.module.scss";
import type { DashboardNavItem } from "../types";

interface SidebarProps {
  title: string;
  items: DashboardNavItem[];
}

export function Sidebar({ title, items }: SidebarProps) {
  return (
    <Card className={styles.sidebar}>
      <CardHeader className={styles.header}>
        <h2>{title}</h2>
      </CardHeader>
      <CardBody className={styles.body}>
        <nav className={styles.nav} aria-label="Navigation secondaire dashboard">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={styles.link}>
              {item.label}
            </Link>
          ))}
        </nav>
      </CardBody>
    </Card>
  );
}
