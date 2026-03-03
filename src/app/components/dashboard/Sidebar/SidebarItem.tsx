"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { SidebarItem as SidebarItemType } from "./sidebarconfig";
import styles from "./Sidebar.module.scss";

interface Props {
  item: SidebarItemType;
  toggleSidebar: () => void;
}

const SidebarItem: React.FC<Props> = ({ item, toggleSidebar }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const query = searchParams.toString();
  const currentPath = `${pathname}${query ? `?${query}` : ""}`;
  const hasActiveChild = Boolean(
    item.children?.some((child) => child.path === currentPath || child.path === pathname),
  );
  const isActive = item.path === currentPath || item.path === pathname || hasActiveChild;

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
      {item.children ? (
        <div className={`${styles.link} ${isActive ? styles.active : ""}`} onClick={handleParentClick}>
          {item.icon && <item.icon className={styles.icon} />}
          <span>{item.label}</span>
          <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.rotate : ""}`} />
        </div>
      ) : (
        <Link
          href={item.path}
          className={`${styles.link} ${isActive ? styles.active : ""}`}
          onClick={toggleSidebar}
        >
          {item.icon && <item.icon className={styles.icon} />}
          <span>{item.label}</span>
        </Link>
      )}

      {item.children && (
        <div className={`${styles.submenu} ${isOpen ? styles.expanded : styles.collapsed}`}>
          {item.children.map((child) => {
            const isChildActive = child.path === currentPath || child.path === pathname;
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
