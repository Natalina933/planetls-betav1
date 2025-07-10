"use client"; // nécessaire pour les hooks côté client

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // hook de Next.js
import styles from "./FirstVisit.module.scss";

const FirstVisit = () => {
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const hasVisited = localStorage.getItem("hasVisited");
        if (!hasVisited) {
            setIsFirstVisit(true);
            localStorage.setItem("hasVisited", "true");
        }
    }, []);

    if (!isFirstVisit) return null;

    const handleContactClick = () => {
        const contactElement = document.getElementById("contact");
        if (contactElement) {
            contactElement.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className={styles.firstVisitOverlay}>
            <div className={styles.card}>
                <button className={styles.closeBtn} onClick={() => setIsFirstVisit(false)}>×</button>
                <h1>Bienvenue sur PlanetLS 🌍</h1>
                <p>Ravi de vous avoir ici ! Parcourez nos services, explorez nos projets et laissez-vous inspirer.</p>
                <div className={styles.actions}>
                    <button onClick={() => router.push("/home")}>Découvrir</button>
                    <button onClick={handleContactClick}>Nous contacter</button>
                </div>
            </div>
        </div>
    );
};

export default FirstVisit;
