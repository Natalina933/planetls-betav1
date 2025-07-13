// src/app/components/layout/Home/MapWithSearch/MapWithSearch.jsx
"use client";
import React, { useState } from "react";
// Importez uniquement les styles généraux de MapWithSearch.module.scss
import styles from "./MapWithSearch.module.scss";
// Importez uniquement les icônes nécessaires pour le reste du composant
import { FaHome, FaBell, FaTools, FaGlobe } from 'react-icons/fa';
import { FaPeopleGroup } from "react-icons/fa6";
// Importez le nouveau composant SearchSection
import SearchSection from './SearchSection';
// Importez le nouveau composant ProfilesDisplay
import ProfilesDisplay from './ProfilesDisplay'; // <-- Nouvelle importation

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

    const profiles = [
        {
            id: 1,
            name: "Jean Dupont",
            type: "concierge",
            position: [48.8566, 2.3522],
            available: true,
            services: ["Gestion", "Nettoyage"],
            photo: "/avatars/jean.png",
        },
        {
            id: 2,
            name: "Marie Artisan",
            type: "artisan",
            position: [48.86, 2.35],
            available: false,
            services: ["Plomberie", "Électricité"],
            photo: "/avatars/marie.png",
        },
        {
            id: 3,
            name: "Paul Proprio",
            type: "proprietaire",
            position: [48.855, 2.34],
            available: true,
            services: [],
            photo: "/avatars/marc.png",
        },
    ];

    const visibleProfiles = filter === "all"
        ? profiles
        : profiles.filter((p) => p.type === filter);

    const handleSearch = () => {
        alert(`Recherche lancée pour : "${location}" dans la catégorie "${filter}".\nRedirection vers la page de résultats...`);
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

            {/* Utilisation du nouveau composant SearchSection */}
            <SearchSection
                location={location}
                setLocation={setLocation}
                handleSearch={handleSearch}
            />

            {/* Utilisation du nouveau composant ProfilesDisplay */}
            <ProfilesDisplay visibleProfiles={visibleProfiles} /> {/* <-- Nouvelle utilisation */}
        </div>
    );
}