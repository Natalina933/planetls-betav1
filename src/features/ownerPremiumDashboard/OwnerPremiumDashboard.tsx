"use client";

import { useEffect, useState } from "react";
import {
  calendarReservations,
  propertyPerformance,
  recentBookings,
  revenueSeries,
  sidebarItems,
  stats,
} from "./data/mockData";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Topbar } from "./components/Topbar/Topbar";
import { StatsGrid } from "./components/Stats/StatsGrid";
import { CalendarWidget } from "./components/CalendarWidget/CalendarWidget";
import { RecentBookingsTable } from "./components/RecentBookings/RecentBookingsTable";
import { RevenueChart } from "./components/RevenueChart/RevenueChart";
import { PropertyPerformance } from "./components/PropertyPerformance/PropertyPerformance";
import { DashboardSkeletons } from "./components/Skeletons/DashboardSkeletons";
import styles from "./styles/OwnerPremiumDashboard.module.scss";

export function OwnerPremiumDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 720);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className={styles.shell}>
      <Sidebar
        items={sidebarItems}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main className={styles.main}>
        <Topbar onQuickAction={() => window.alert("Quick action modal placeholder")} />

        {loading ? (
          <DashboardSkeletons />
        ) : (
          <>
            <StatsGrid items={stats} />

            <div className={styles.contentGrid}>
              <div className={styles.primaryColumn}>
                <RevenueChart data={revenueSeries} />
                <RecentBookingsTable rows={recentBookings} />
              </div>

              <div className={styles.secondaryColumn}>
                <CalendarWidget monthLabel="March 2026" reservations={calendarReservations} />
                <PropertyPerformance items={propertyPerformance} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
