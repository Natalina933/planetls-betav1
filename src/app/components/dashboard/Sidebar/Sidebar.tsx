"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { signOut } from "next-auth/react";
import styles from "./Sidebar.module.scss";
import { sidebarConfig } from "@/app/components/dashboard/Sidebar/sidebarconfig";
import { useUserType } from "@/app/context/UserTypeContext";

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  concierge: "Conciergerie",
  artisan: "Artisan",
  providence: "Providence",
};

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const { userType } = useUserType();

  const menuItems =
    userType && sidebarConfig[userType as keyof typeof sidebarConfig]
      ? sidebarConfig[userType as keyof typeof sidebarConfig]
      : [];

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={toggleSidebar} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`} aria-label="Sidebar">
        <div className={styles.header}>
          <span className={styles.title}>
            {userType ? `Espace ${roleLabels[userType] || userType}` : "Chargement..."}
          </span>
          <button onClick={toggleSidebar} className={styles.closeBtn} aria-label="Fermer la sidebar">
            <svg width="24" height="24" fill="none" stroke="currentColor" className={styles.closeIcon}>
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
              <line x1="20" y1="4" x2="4" y2="20" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.length === 0 ? (
            <p>Aucun menu disponible</p>
          ) : (
            menuItems.map(({ label, path, icon: Icon }) => {
              const isActive = pathname === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className={`${styles.link} ${isActive ? styles.active : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={toggleSidebar}
                >
                  {Icon && <Icon className={styles.icon} />}
                  <span>{label}</span>
                </Link>
              );
            })
          )}
        </nav>

        <div className={styles.footer}>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className={styles.logout}
            aria-label="Se déconnecter"
            style={{ cursor: "pointer" }}
          >
            <FiLogOut className={styles.icon} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
