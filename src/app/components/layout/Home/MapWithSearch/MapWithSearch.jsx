// src/app/components/layout/Home/MapWithSearch/MapWithSearch.jsx
"use client";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import styles from "./MapWithSearch.module.scss";
// Remis aux icônes d'origine (Fa) comme dans votre code le plus récent
import { FaHome, FaBell, FaTools, FaGlobe, FaSearch } from 'react-icons/fa';
import { FaPeopleGroup } from "react-icons/fa6";
// SearchSection n'est pas utilisé dans le code fourni, je l'ai laissé commenté si vous n'en avez pas besoin.
// import SearchSection from './SearchSection';

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
    // {
    //     key: "all",
    //     label: "Tous",
    //     iconComponent: () => (
    //         <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    //             <FaGlobe style={{ position: 'absolute', fontSize: '4.5em', color: 'white', opacity: 1 }} />
    //             <FaPeopleGroup style={{ position: 'absolute', fontSize: '2em', color: 'gold', zIndex: 1 }} />
    //         </div>
    //     ),
    //     image: "/images/carousel/all.jpg",
    //     description: "Tous les professionnels de la location saisonnière",
    // }
];

export default function MapWithSearch() {
    const [filter, setFilter] = useState("all");
    const [location, setLocation] = useState("");
    const router = useRouter();

    const handleSearch = () => {
        router.push(`/map-list?filter=${filter}&location=${encodeURIComponent(location)}`);
    };

    return (
        <div className={styles.mapWithSearchSection}>
            {/* <header className={styles.intro}>
                <section className={styles.headerContent}>
                    <div className={styles.headerContentWrapper}>
                        <h2>
                            Mise en relation entre tous les acteurs de la location saisonnière
                        </h2>
                        <span className={styles.introDescription}>
                            Trouvez en un clin d’œil <strong>propriétaires</strong>, <strong>concierges</strong> et
                            <strong> artisans locaux</strong> prêts à vous aider. Publiez vos services et entrez en
                            contact rapidement.
                        </span>
                    </div>
                </section>
                <div className={styles.headerImageCol}>
                    <img
                        src={activeCategory.image}
                        alt={`Image illustrative pour la catégorie ${activeCategory.label}`}
                        className={styles.headerBackgroundImage}
                    />
                    <div className={styles.imageWaveEffect} aria-hidden="true"></div>
                </div>
            </header> */}

            <section className={styles.categorySearchSection}>
                <div className={styles.categoryInstructionWrapper}>
                    <h2 className={styles.categoryTitle}>
                        Trouvez les bons partenaires pour votre activité saisonnière
                    </h2>

                    <h3 className={styles.categoryInstruction}>
                        Accélérez vos projets grâce à un réseau de professionnels engagés dans l’économie de proximité.
                        Recherchez facilement des partenaires de confiance autour de vous : services de conciergerie, interventions artisanales, collaborations entre loueurs, et bien plus.

                    </h3>
                </div>

                <div className={styles.bubblesRow}>
                    {CATEGORY_CONFIG.map(({ key, label, iconComponent: Icon, description }, index) => (
                        <div
                            key={key}
                            className={`${styles.bubbleBlock} ${filter === key ? styles.active : ""}`}
                            style={{
                                '--bubble-primary': `var(--${key}-primary, var(--color-primary))`,
                                '--bubble-hover': `var(--${key}-hover, var(--color-primary-light))`,
                                '--bubble-bg': `var(--${key}-bg, #fff)`,
                                '--bubble-text': `var(--${key}-text, var(--color-text))`,
                                // Passage de l'index pour l'animation échelonnée
                                animationDelay: `${index * 0.1}s`
                            }}
                        >
                            <button
                                className={styles.bubbleBtn}
                                onClick={() => setFilter(key)}
                                aria-label={`Filtrer par ${label}`}
                                type="button"
                            >
                                <span className={styles.bubbleIcon}><Icon size="1.7em" /></span>
                            </button>

                            {/* <div className={`${styles.bubbleLabel}`}>{label}</div> */}
                            {filter === key && (
                                <div className={styles.categoryTextBubble} style={{ color: `var(--${key}-text)` }}>
                                    <h3>{label}</h3>
                                    <p>{description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.searchBarWrapper}>
                    <span className={styles.categoryInstruction}>
                        Utilisez les filtres de catégorie ci-dessus et entrez votre localisation,

                        et trouvez rapidement les bons contacts.
                    </span>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            placeholder="Où recherchez-vous ?"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button
                            onClick={handleSearch}
                            aria-label="Rechercher"
                            type="button"
                        >
                            <FaSearch />
                        </button>
                    </div>

                </div>
            </section>

        </div>
    );
}