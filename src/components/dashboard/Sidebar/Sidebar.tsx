"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./Sidebar.module.scss";
import type { DashboardNavItem } from "../types";

interface SidebarProps {
  title: string;
  items: DashboardNavItem[];
}

export function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Card className={styles.sidebar}>
      <CardHeader className={styles.header}>
        <h2>{title}</h2>
      </CardHeader>
      <CardBody className={styles.body}>
        <nav className={styles.nav} aria-label="Navigation secondaire dashboard">
          {items.map((item) => {
            const isRootDashboard =
              item.href === "/dashboard/owner" ||
              item.href === "/dashboard/concierge" ||
              item.href === "/dashboard/provider" ||
              item.href === "/dashboard/admin";
            const isActive =
              pathname === item.href || (!isRootDashboard && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[styles.link, isActive ? styles.active : ""].filter(Boolean).join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </CardBody>
    </Card>
  );
}
