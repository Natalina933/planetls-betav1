"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { designSections, designSpaces } from "./navigation";
import styles from "../atelier.module.scss";

export function DesignNavigation() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  return <aside className={styles.sidebar}>
    <Link href="/design-system" className={styles.brand}>PlanetLS <span>Design & maquettes</span></Link>
    <Button className={styles.menu} variant="outline" aria-expanded={open} aria-controls="design-navigation" onClick={() => setOpenPath(open ? null : pathname)}>Explorer l’atelier</Button>
    <nav id="design-navigation" className={styles.navigation} data-open={open} aria-label="Atelier Design">
      {designSections.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpenPath(null)}>{item.title}</Link>)}
      <div className={styles.spaces} role="group" aria-label="Comparer les quatre espaces">
        {designSpaces.map((item) => <Link key={item.id} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpenPath(null)}>{item.title}</Link>)}
      </div>
      <Link className={styles.returnLink} href="/dashboard">← Mon tableau de bord</Link>
    </nav>
  </aside>;
}
