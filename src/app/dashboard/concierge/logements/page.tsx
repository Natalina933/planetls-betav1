"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import Image from "next/image";
import styles from "./LogementsPage.module.scss";
import StatsLogements from "../logements/StatsLogements";

interface Logement {
    id: number;
    nom_logement: string;
    ville: string;
    photo_principale?: string;
    statut: "pret" | "menage" | "arrivee" | "depart";
}

export default function LogementsPage() {
    const [logements, setLogements] = useState<Logement[]>([]);

    useEffect(() => {
        async function loadLogements() {
            const res = await fetch("/api/housing");
            const data = await res.json();
            setLogements(data);
        }
        loadLogements();
    }, []);

    return (
        <div className={styles.logementsPage}>
            
            <div className="header">
                <h1>Mes Logements</h1>
                <Link href="/dashboard/concierge/logements/create" className="btn-add">
                    <FiPlus /> Ajouter un logement
                </Link>
            </div>

            <StatsLogements
                total={logements.length}
                prets={logements.filter(l => l.statut === "pret").length}
                menages={logements.filter(l => l.statut === "menage").length}
                arrivees={logements.filter(l => l.statut === "arrivee").length}
                departs={logements.filter(l => l.statut === "depart").length}
            />

            <div className={styles.logementsGrid}>
                {logements.map((logement) => (
                    <Link
                        key={logement.id}
                        href={`/dashboard/concierge/logements/${logement.id}`}
                        className={styles.logementCard}
                    >
                        <div className={styles.cardImageWrapper}>
                            <Image
                                src={logement.photo_principale || "/icons/home-icon.svg"}
                                alt={logement.nom_logement}
                                width={220}
                                height={180}
                                className={styles.cardImage}
                            />
                        </div>

                        <div className={styles.cardBody}>
                            <h2 className={styles.cardTitle}>{logement.nom_logement}</h2>

                            <p className={styles.cardMeta}>
                                <span className={styles.metaItem}>Type : Appartement</span>
                                <span className={styles.metaItem}>Ville : {logement.ville}</span>
                            </p>

                            <div className={styles.cardFooter}>
                                <span className={`${styles.status} ${styles[`status-${logement.statut}`]}`}>
                                    {logement.statut === "pret" && "Prêt"}
                                    {logement.statut === "menage" && "Ménage en cours"}
                                    {logement.statut === "arrivee" && "Arrivée du jour"}
                                    {logement.statut === "depart" && "Départ du jour"}
                                </span>

                                <span className={styles.btnView}>Voir →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

        </div>
    );
}
