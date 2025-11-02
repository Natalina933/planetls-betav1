// src/app/dashboard/layout.tsx
"use client";

import React, { useState } from "react";
// Assurez-vous d'importer les chemins corrects
import Providers from "@/app/components/dashboard/Provider"; 
import Sidebar from "@/app/components/dashboard/Sidebar/Sidebar";
// Le nom du fichier de Navbar est DashboardNavbar.tsx, mais l'importation par défaut est 'Navbar'
import Navbar from "@/app/components/dashboard/navbar/DashboardNavbar"; 
import "@/app/styles/abstracts/_dashboards.scss"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // 1. État local de la Sidebar
    // Garder la sidebar ouverte par défaut est une bonne pratique sur desktop.
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Fonction de bascule à passer aux composants enfants
    const toggleSidebar = () => setIsSidebarOpen((s) => !s);

    return (
        // Providers (contexte d'authentification, de rôle, etc.)
        <Providers>
            {/* 2. Classe SCSS racine */}
            <div className="dashboard-root">
                
                {/* 3. Sidebar (fermée sur mobile via SCSS/media query) */}
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    toggleSidebar={toggleSidebar} 
                />
                
                {/* 4. Contenu principal */}
                <div className={`dashboard-main ${isSidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
                    
                    {/* 5. Navbar (Utilise la prop correcte pour la bascule) */}
                    <Navbar toggleSidebar={toggleSidebar} />
                    
                    {/* 6. Contenu de la page spécifique (ex: /concierge, /owner/planning, etc.) */}
                    <main className="dashboard-content">{children}</main>
                </div>
            </div>
        </Providers>
    );
}