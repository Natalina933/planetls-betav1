"use client";
import React, { useState } from "react";
// import Head from 'next/head'; // Uncomment if you are using Next.js App Router for <head> management
import styles from "./MapWithSearch.module.scss";
import { FaHome, FaBell, FaTools, FaGlobe, FaSearchLocation } from 'react-icons/fa';
import { FaPeopleGroup } from "react-icons/fa6";
// import { useRouter } from 'next/navigation';
// const router = useRouter();

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
        // Modifier ceci pour un composant qui rendra les deux icônes
        iconComponent: () => (
            <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaGlobe style={{ position: 'absolute', fontSize: '4.5em', color: 'white', opacity: 1 }} />
                {/* Garde FaPeopleGroup en or spécifique ou changez-le si vous voulez aussi qu'il suive la variable */}
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
        // router.push(`/search-results?location=${location}&category=${filter}`);
    };

    return (
        <div className={styles.mapWithSearchSection}>
            {/* If using Next.js App Router, uncomment and use Head for SEO metadata */}
            {/*
            <Head>
                <title>Trouvez des professionnels pour votre location saisonnière - LocationFacile</title>
                <meta name="description" content="Découvrez et contactez des propriétaires, concierges et artisans locaux pour tous vos besoins en matière de location saisonnière." />
                <meta name="keywords" content="location saisonnière, propriétaires, concierges, artisans, recherche locale, gestion immobilière" />
                <meta property="og:title" content="Trouvez des professionnels pour votre location saisonnière" />
                <meta property="og:description" content="Découvrez et contactez des propriétaires, concierges et artisans locaux pour tous vos besoins en matière de location saisonnière." />
                <meta property="og:image" content="/images/social-share.jpg" /> // Replace with an actual social share image
                <meta property="og:url" content="YOUR_WEBSITE_URL/map-with-search" /> // Replace with your actual page URL
            </Head>
            */}

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
                            {/* <p className={styles.bubbleLabel}>{label}</p> Added label below bubble */}
                            {/* <p className={styles.bubbleDescription}>{description}</p> Added description below label */}
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

            <section className={styles.searchSection}>
                <h2>Recherchez un professionnel dans votre région</h2>
                <div className={styles.searchInputGroup}>
                    <FaSearchLocation className={styles.searchIcon} aria-hidden="true" />
                    <label htmlFor="location-input" className="sr-only">Saisir une ville, code postal...</label>
                    <input
                        id="location-input"
                        type="text"
                        placeholder="Saisir une ville, code postal..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={styles.locationInput}
                        aria-label="Saisir une ville ou un code postal"
                    />
                    <button onClick={handleSearch} className={styles.searchButton} type="button"> {/* Changed to searchButton */}
                        Rechercher
                    </button>
                </div>
                <p className={styles.searchGuidance}>
                    Entrez votre emplacement pour trouver les professionnels disponibles près de chez vous.
                </p>
            </section>

            <div className={styles.profilesDisplay}>
                {visibleProfiles.length > 0 ? (
                    <ul className={styles.profileList}>
                        {visibleProfiles.map(({ id, name, type, photo, services }) => (
                            <li key={id} className={`${styles.profileItem} ${styles[type]}`}>
                                <img src={photo} alt={`Avatar de ${name}, ${type}`} className={styles.profileAvatar} />
                                <div className={styles.profileDetails}>
                                    <h4>{name} ({type.charAt(0).toUpperCase() + type.slice(1)})</h4> {/* Capitalize type for display */}
                                    <p>Services : {services.length ? services.join(", ") : "Non renseignés"}</p>
                                    <button className={styles.profileContactBtn}>Contacter</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={styles.noResult}>Aucun profil trouvé dans cette catégorie pour la démo.</div>
                )}
            </div>
        </div>
    );
}