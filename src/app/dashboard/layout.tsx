"use client";
import Sidebar from "@/app/components/dashboard/Sidebar";
import "@/app/styles/abstracts/_dashboards.scss";

import React, { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => setIsOpen((prev) => !prev);

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
            <main className="dashboard-content">
                {children}  {/* Ici sera injecté le contenu de chaque page.tsx */}
            </main>
        </div>
    );
}
