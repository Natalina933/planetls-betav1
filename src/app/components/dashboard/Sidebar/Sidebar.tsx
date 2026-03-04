"use client";

import React, { useEffect } from "react";
import { FiLogOut } from "react-icons/fi";
import { signOut } from "next-auth/react";
import { useUserType } from "@/app/context/UserTypeContext";
import { sidebarConfig } from "./sidebarconfig";
import SidebarItem from "./SidebarItem";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const roleLabels: Record<string, string> = {
  owner: "propriétaire",
  concierge: "concierge",
  provider: "artisan",
};

const roleThemeClasses: Record<string, string> = {
  owner: styles.ownerTheme,
  concierge: styles.conciergeTheme,
  provider: styles.providerTheme,
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { userType } = useUserType();

  const menuItems =
    userType && sidebarConfig[userType as keyof typeof sidebarConfig]
      ? sidebarConfig[userType as keyof typeof sidebarConfig]
      : [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        toggleSidebar();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, toggleSidebar]);

  return (
    <>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={toggleSidebar}
          role="button"
          tabIndex={-1}
          aria-label="Fermer la sidebar"
        />
      )}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${
          userType ? roleThemeClasses[userType] || "" : ""
        }`}
        aria-label="Sidebar"
      >
        <div className={styles.header}>
          <span className={styles.title}>
            {userType ? `Espace ${roleLabels[userType] || userType}` : "Chargement..."}
          </span>
          <button
            onClick={toggleSidebar}
            className={styles.closeBtn}
            aria-label="Fermer la sidebar"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              className={styles.closeIcon}
            >
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
              <line x1="20" y1="4" x2="4" y2="20" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.length === 0 ? (
            <p>Aucun menu disponible</p>
          ) : (
            menuItems.map((item) => (
              <SidebarItem key={item.label} item={item} toggleSidebar={toggleSidebar} />
            ))
          )}
        </nav>

        <div className={styles.footer}>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className={styles.logout}
            aria-label="Se deconnecter"
          >
            <FiLogOut className={styles.icon} />
            <span>Se deconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
