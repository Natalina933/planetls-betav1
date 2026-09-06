import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DesignNavigation } from "./_components/DesignNavigation";
import styles from "./atelier.module.scss";

export const metadata: Metadata = { title: "Design & maquettes", robots: { index: false, follow: false } };

export default function DesignLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>
    <a className={styles.skip} href="#design-content">Aller au contenu</a>
    <DesignNavigation />
    <div id="design-content" tabIndex={-1} className={styles.content}>{children}</div>
  </div>;
}
