import type { Metadata } from "next";
import OwnerReferenceDashboard from "./OwnerReferenceDashboard";
import styles from "../atelier.module.scss";

export const metadata: Metadata = {
    title: "Dashboard propriétaire (référence) | Design & maquettes",
    robots: { index: false, follow: false },
};

export default function OwnerReferencePage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <span className={styles.eyebrow}>06 · Parcours propriétaire</span>
                <h1>Dashboard propriétaire — composition de référence</h1>
                <p>
                    Prototype isolé avec données fictives, même identité PlanetLS que l&apos;espace Concierge.
                    Aucune page métier réelle n&apos;est modifiée par cet atelier.
                </p>
            </header>
            <OwnerReferenceDashboard />
        </div>
    );
}
