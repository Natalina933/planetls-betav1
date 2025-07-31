'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './CategoryCarousel.module.scss';

const categories = [
    { key: "proprietaire", name: "Propriétaires", image: "/images/carousel/proprio.jpeg", legend: "Propriétaires locaux, engagés et à l’écoute" },
    { key: "concierge", name: "Conciergerie", image: "/images/carousel/concierges.jpg", legend: "Concierges de quartier, service sur-mesure" },
    { key: "artisan", name: "Artisans", image: "/images/carousel/artisans.jpg", legend: "Artisans passionnés, savoir-faire local" },
    { key: "commercant", name: "Commerçants", image: "/images/carousel/commercant.jpeg", legend: "Commerçants de proximité, produits uniques" },
    { key: "photographe", name: "Photographes", image: "/images/carousel/photographe.jpg", legend: "Photographes inspirés, regards neufs" },
    { key: "jardinier", name: "Jardiniers", image: "/images/carousel/jardinier.jpg", legend: "Jardiniers urbains, espaces vivants" },
    { key: "reseaux", name: "Réseaux sociaux", image: "/images/carousel/reseaux.jpeg", legend: "Experts réseaux sociaux, visibilité locale" },
];

const categoryFilter = {
    proprietaire: "var(--proprio-primary)",
    concierge: "var(--concierge-primary)",
    artisan: "var(--artisan-primary)",
    commercant: "#c17c54",
    photographe: "#5c89ff",
    jardinier: "#82a27c",
    reseaux: "#b85cff",
};

export default function CategoryCarousel() {
    const [active, setActive] = useState(0);
    const timeoutRef = useRef();

    // Autoplay effect
useEffect(() => {
    try {
        if (categories.length === 0) return;

        timeoutRef.current = setTimeout(() => {
            setActive((prev) => (prev + 1) % categories.length);
        }, 3500);
    } catch (error) {
        console.error("❌ Erreur dans l'autoplay du carousel :", error);
    }

    return () => {
        try {
            clearTimeout(timeoutRef.current);
        } catch (error) {
            console.warn("⚠️ Erreur lors du nettoyage du timeout :", error);
        }
    };
}, [active, categories]);


    // Navigation
    const goTo = (idx) => setActive(idx);
    // const prev = () => setActive((active - 1 + categories.length) % categories.length);
    // const next = () => setActive((active + 1) % categories.length);

    return (
        <div className={styles.carousel}>
            <div className={styles.slider}>
                {categories.map((cat, idx) => (
                    <div
                        key={cat.key}
                        className={`${styles.slide} ${styles[cat.key] || ''}`}
                        style={{
                            display: idx === active ? 'flex' : 'none',
                            "--color-filter": categoryFilter[cat.key] || "var(--color-accent)",
                        }}
                        aria-hidden={idx !== active}
                    >
                        <div className={styles.imageWrapper}>
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className={styles.image}
                                loading="lazy"
                            />
                            <div className={styles.legend}>
                                <span>{cat.legend}</span>
                            </div>
                            <div className={styles.badge} style={{ backgroundColor: categoryFilter[cat.key] }}>
                                {cat.name}
                            </div>
                        </div>
                    </div>
                ))}
                {/* Flèches */}
                {/* <button className={styles.arrow + ' ' + styles.left} onClick={prev} aria-label="Précédent">
                    ‹
                </button>
                <button className={styles.arrow + ' ' + styles.right} onClick={next} aria-label="Suivant">
                    ›
                </button> */}
            </div>
            {/* Pagination */}
            <div className={styles.pagination}>
                {categories.map((_, idx) => (
                    <button
                        key={idx}
                        className={styles.dot + (active === idx ? ' ' + styles.active : '')}
                        onClick={() => goTo(idx)}
                        aria-label={`Aller à la slide ${idx + 1}`}
                        aria-current={active === idx ? "true" : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
