"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar/Sidebar";
import Navbar from "@/components/dashboard/navbar/DashboardNavbar";
import "@/app/styles/abstracts/_dashboards.scss";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-root">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((current) => !current)}
      />
      <div className={`dashboard-main ${isSidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
        <Navbar toggleSidebar={() => setIsSidebarOpen((current) => !current)} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
