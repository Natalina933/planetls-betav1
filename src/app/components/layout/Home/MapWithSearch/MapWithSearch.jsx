// src/app/components/layout/Home/MapWithSearch/MapWithSearch.jsx
"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation'; // <-- Changed import for App Router
import styles from "./MapWithSearch.module.scss";
import { FaHome, FaBell, FaTools, FaGlobe } from 'react-icons/fa';
import { FaPeopleGroup } from "react-icons/fa6";
import SearchSection from './SearchSection';

const CATEGORY_CONFIG = [
    {
        key: "proprietaire",
        label: "Propriétaires",
        iconComponent: FaHome,
        image: "/images/carousel/proprio.jpeg",
        description: "Propriétaires locaux, engagés et à l’écoute",
    },
    {
        key: "concierge",
        label: "Conciergerie",
        iconComponent: FaBell,
        image: "/images/carousel/concierges.jpg",
        description: "Concierges de quartier, service sur-mesure",
    },
    {
        key: "artisan",
        label: "Artisans",
        iconComponent: FaTools,
        image: "/images/carousel/artisans.jpg",
        description: "Artisans passionnés, savoir-faire local",
    },
    {
        key: "all",
        label: "Tous",
        iconComponent: () => (
            <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaGlobe style={{ position: 'absolute', fontSize: '4.5em', color: 'white', opacity: 1 }} />
                <FaPeopleGroup style={{ position: 'absolute', fontSize: '2em', color: 'gold', zIndex: 1 }} />
            </div>
        ),
        image: "/images/carousel/all.jpg",
        description: "Tous les professionnels de la location saisonnière",
    },
];

export default function MapWithSearch() {
    const [filter, setFilter] = useState("all");
    const [location, setLocation] = useState("");
    const activeCategory = CATEGORY_CONFIG.find(cat => cat.key === filter) || CATEGORY_CONFIG[0];
    const router = useRouter();

    const handleSearch = () => {
        // Redirige vers la page map-list avec les paramètres de recherche dans l'URL
        // Note: Dans l'App Router, les query params sont ajoutés directement à l'URL.
        router.push(`/map-list?filter=${filter}&location=${encodeURIComponent(location)}`);
    };

    return (
        <div className={styles.mapWithSearchSection}>
            <header className={styles.intro}>
                <div className={styles.headerContentWrapper}>
                    <h2>Regroupement des Besoins pour la Location saisonnière</h2>
                    <p className={styles.introSub}>Trouvez des artisans, concierges et propriétaires locaux pour vos besoins.</p>
                    <p className={styles.introDescription}>
                        Que vous soyez un propriétaire à la recherche d'un concierge fiable, un voyageur ayant besoin d'un artisan pour une réparation rapide,
                        ou simplement désireux de découvrir les professionnels locaux, notre plateforme vous connecte avec les bonnes personnes.
                        Simplifiez la gestion de vos propriétés et profitez d'un service de qualité.
                    </p>
                </div>
                <div className={styles.headerImageCol}>
                    <img
                        src={activeCategory.image}
                        alt={`Image illustrative pour la catégorie ${activeCategory.label}`}
                        className={styles.headerBackgroundImage}
                    />
                    <div className={styles.imageWaveEffect} aria-hidden="true"></div>
                </div>
            </header>

            <section className={styles.categorySearchSection}>
                <div className={styles.categoryInstructionWrapper}>
                    <h2 className={styles.categoryInstruction}>
                        Utilisez les filtres de catégorie ci-dessous et entrez votre localisation pour affiner votre recherche.
                    </h2>
                </div>

                <div className={styles.bubblesRow}>
                    {CATEGORY_CONFIG.map(({ key, label, iconComponent: Icon, description }) => (
                        <div
                            key={key}
                            className={`${styles.bubbleBlock} ${filter === key ? styles.active : ""}`}
                            style={{
                                '--bubble-primary': `var(--${key}-primary)`,
                                '--bubble-hover': `var(--${key}-hover)`,
                                '--bubble-bg': `var(--${key}-bg)`,
                                '--bubble-text': `var(--${key}-text)`,
                            }}
                        >
                            <button
                                className={styles.bubbleBtn}
                                onClick={() => setFilter(key)}
                                aria-label={`Filtrer par ${label}`}
                                type="button"
                            >
                                <span className={styles.bubbleIcon}><Icon size="2.2em" /></span>
                            </button>
                            {filter === key && (
                                <div className={styles.categoryTextBubble} style={{ color: `var(--${key}-text)` }}>
                                    <h3>{label}</h3>
                                    <p>{description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <SearchSection
                location={location}
                setLocation={setLocation}
                handleSearch={handleSearch}
            />
        </div>
    );
}