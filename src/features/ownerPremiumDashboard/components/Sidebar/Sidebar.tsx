import styles from "./Sidebar.module.scss";
import type { SidebarItem } from "../../types";

type SidebarProps = {
  items: SidebarItem[];
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ items, collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`} aria-label="Sidebar Navigation">
      <div className={styles.header}>
        <div className={styles.brandMark} aria-hidden="true">PL</div>
        {!collapsed ? <div className={styles.brandText}>PlanetLS Owner</div> : null}
        <button type="button" className={styles.toggle} onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? "?" : "?"}
        </button>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <button key={item.id} type="button" className={styles.navItem}>
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            {!collapsed ? <span>{item.label}</span> : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}
