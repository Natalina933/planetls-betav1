"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiUser, FiBarChart2, FiSettings } from "react-icons/fi";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const menuItems = [
    { name: "Accueil", path: "/", icon: <FiHome /> },
    { name: "Profil", path: "/profile", icon: <FiUser /> },
    { name: "Tableau de bord", path: "/dashboard", icon: <FiBarChart2 /> },
    { name: "Paramètres", path: "/settings", icon: <FiSettings /> },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
    const pathname = usePathname();

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={toggleSidebar} />}

            <aside
                className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
                aria-label="Sidebar"
            >
                <div className={styles.header}>
                    <span className={styles.title}>Mon Application</span>
                    <button onClick={toggleSidebar} className={styles.closeBtn} aria-label="Fermer la sidebar">
                        <svg width="24" height="24" fill="none" stroke="currentColor" className={styles.closeIcon}>
                            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
                            <line x1="20" y1="4" x2="4" y2="20" strokeWidth="2" />
                        </svg>
                    </button>
                </div>
                <nav className={styles.nav}>
                    {menuItems.map(({ name, path, icon }) => {
                        const isActive = pathname === path;
                        return (
                            <Link
                                key={path}
                                href={path}
                                className={`${styles.link} ${isActive ? styles.active : ""}`}
                                aria-current={isActive ? "page" : undefined}
                            >
                                <span className={styles.icon}>{icon}</span>
                                <span>{name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
