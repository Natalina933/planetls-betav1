"use client";

import { useEffect, useId, useState, type FocusEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { SidebarItem } from "./sidebarconfig";
import styles from "./Sidebar.module.scss";

export function ConciergeSidebarLink({ item, active, compact, count, onNavigate }: {
  item: SidebarItem; active: boolean; compact: boolean; count: number; onNavigate: () => void;
}) {
  const tooltipId = useId();
  const [tooltip, setTooltip] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    const dismiss = () => setTooltip(null);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, []);
  const showTooltip = (event: FocusEvent<HTMLAnchorElement> | MouseEvent<HTMLAnchorElement>) => {
    if (!compact) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  };
  const alias = item.path === "/dashboard/concierge/billing";
  const description = `${item.label}${alias ? " — espace commun Devis et Factures" : ""}`;
  return <>
    <Link href={item.path} className={`${styles.link} ${active ? styles.active : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={`${item.label}${count ? `, ${count} notification(s)` : ""}`}
      aria-describedby={compact && tooltip ? tooltipId : undefined}
      onClick={() => { setTooltip(null); onNavigate(); }}
      onFocus={showTooltip} onMouseEnter={showTooltip}
      onBlur={() => setTooltip(null)} onMouseLeave={() => setTooltip(null)}
      onKeyDown={event => { if (event.key === "Escape") { setTooltip(null); event.stopPropagation(); } }}>
      {item.icon && <item.icon className={styles.icon} aria-hidden="true" />}
      <span className={styles.conciergeLinkLabel}>{item.label}</span>
      {count > 0 && <span className={styles.itemBadge} aria-hidden="true">{count > 9 ? "9+" : count}</span>}
    </Link>
    {compact && tooltip && createPortal(<span id={tooltipId} role="tooltip" className={styles.conciergeTooltip}
      style={{ top: tooltip.top, left: tooltip.left }}>{description}</span>, document.body)}
  </>;
}
