import type { Metadata } from "next";
import RouteTourPrototype from "./RouteTourPrototype";
import styles from "../atelier.module.scss";

export const metadata: Metadata = {
    title: "Tournée concierge | Design & maquettes",
    robots: { index: false, follow: false },
};

export default function RouteTourPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <span className={styles.eyebrow}>05 · Parcours concierge</span>
                <h1>Tournée du jour / Trajets Concierge</h1>
                <p>Prototype visuel avec données fictives pour tester l&apos;ordre des missions, les déplacements et les retards avant toute intégration métier.</p>
            </header>
            <RouteTourPrototype />
        </div>
    );
}
