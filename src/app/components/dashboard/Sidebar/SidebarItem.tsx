"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarItem as SidebarItemType } from "./sidebarconfig";
import styles from "./Sidebar.module.scss";
import { FiChevronDown } from "react-icons/fi";

interface Props {
    item: SidebarItemType;
    toggleSidebar: () => void;
}

const SidebarItem: React.FC<Props> = ({ item, toggleSidebar }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = item.path === pathname;

    useEffect(() => {
        const saved = localStorage.getItem(`sidebar-${item.label}`);
        if (saved === "true") setIsOpen(true);
    }, [item.label]);

    useEffect(() => {
        localStorage.setItem(`sidebar-${item.label}`, String(isOpen));
    }, [isOpen, item.label]);

    const handleParentClick = () => {
        if (item.children) {
            setIsOpen((prev) => !prev);
        }
    };

    return (
        <div className={styles.menuGroup}>

            {/* ITEM AVEC OU SANS LIEN */}
            {item.children ? (
                /* Cas 1 : item avec children → pas de Link au parent */
                <div
                    className={`${styles.link} ${isActive ? styles.active : ""}`}
                    onClick={handleParentClick}
                >
                    {item.icon && <item.icon className={styles.icon} />}
                    <span>{item.label}</span>
                    <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.rotate : ""}`} />
                </div>
            ) : (
                /* Cas 2 : item SANS children → Link direct */
                <Link
                    href={item.path}
                    className={`${styles.link} ${isActive ? styles.active : ""}`}
                    onClick={toggleSidebar}
                >
                    {item.icon && <item.icon className={styles.icon} />}
                    <span>{item.label}</span>
                </Link>
            )}

            {/* SOUS-MENU */}
            {item.children && (
                <div className={`${styles.submenu} ${isOpen ? styles.expanded : styles.collapsed}`}>
                    {item.children.map((child) => {
                        const isChildActive = pathname === child.path;
                        return (
                            <Link
                                key={child.path}
                                href={child.path}
                                className={`${styles.sublink} ${isChildActive ? styles.active : ""}`}
                                onClick={toggleSidebar}
                            >
                                {child.icon && <child.icon className={styles.icon} />}
                                <span>{child.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SidebarItem;
