//src/app/dashboard/layout.tsx
"use client";

import React, { useState } from "react";
import Providers from "@/app/components/dashboard/Provider"; // ton composant dédié
import Sidebar from "@/app/components/dashboard/Sidebar/Sidebar";
import Navbar from "@/app/components/dashboard/Navbar";
import "@/app/styles/abstracts/_dashboards.scss";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <Providers>
            <div className="dashboard-root">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((s) => !s)} />
                <div className={`dashboard-main ${isSidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
                    <Navbar onToggleSidebar={() => setIsSidebarOpen((s) => !s)} />
                    <main className="dashboard-content">{children}</main>
                </div>
            </div>
        </Providers>
    );
}
