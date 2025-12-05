// app/dashboard/concierge/logements/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
// import { IoIosHome } from "react-icons/io";
// import { IoIosPerson } from "react-icons/io";
// import { IoIosCalendar } from "react-icons/io";
import Image from "next/image";
import styles from "./LogementsPage.module.scss";

interface Logement {
    id: number;
    name: string;
    city: string;
    photo?: string;
    status: "pret" | "menage" | "arrivee" | "depart";
}

export default function LogementsPage() {
    const [logements, setLogements] = useState<Logement[]>([]);

    useEffect(() => {
        // Appel API (mock en attendant le vrai backend)
        setLogements([
            {
                id: 1,
                name: "Appartement Haussmannien",
                city: "Paris",
                photo: "/images/default-logement.jpg",
                status: "menage",
            },
            {
                id: 2,
                name: "Studio Centre-Ville",
                city: "Lyon",
                photo: "/images/default-logement.jpg",
                status: "pret",
            },
        ]);
    }, []);

    return (
        <div className={styles.logementsPage}>

            {/* HEADER */}
            <div className="header">
                <h1>Mes Logements</h1>
                <Link href="/dashboard/concierge/logements/create" className="btn-add">
                    <FiPlus /> Ajouter un logement
                </Link>
            </div>

            {/* STATS */}
            <div className="stats">
                <div className="card">
                    <span>Total</span>
                    <strong>{logements.length}</strong>
                </div>
                <div className="card">
                    <span>Prêts</span>
                    <strong>{logements.filter(l => l.status === "pret").length}</strong>
                </div>
                <div className="card">
                    <span>En ménage</span>
                    <strong>{logements.filter(l => l.status === "menage").length}</strong>
                </div>
            </div>

            {/* TABLEAU */}
            <table className="logements-table">
                <thead>
                    <tr>
                        <th>Logement</th>
                        <th>Ville</th>
                        <th>Statut</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {logements.map((logement) => (
                        <tr key={logement.id}>
                            <td className="cell-logement">
                                <Image
                                    src={logement.photo || "/images/default-logement.jpg"}
                                    alt={logement.name}
                                    width={60}
                                    height={60}
                                    className="logement-img"
                                />                                <span>{logement.name}</span>
                            </td>

                            <td>{logement.city}</td>

                            <td>
                                <span className={`status status-${logement.status}`}>
                                    {logement.status === "pret" && "Prêt"}
                                    {logement.status === "menage" && "Ménage en cours"}
                                    {logement.status === "arrivee" && "Arrivée du jour"}
                                    {logement.status === "depart" && "Départ du jour"}
                                </span>
                            </td>

                            <td>
                                <Link
                                    href={`/dashboard/concierge/logements/${logement.id}`}
                                    className="btn-view"
                                >
                                    Voir
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}
