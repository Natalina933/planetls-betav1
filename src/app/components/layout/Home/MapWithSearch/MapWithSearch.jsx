"use client";
import React, { useState } from "react";
import styles from "./MapWithSearch.module.scss";
import { FaHome, FaBell, FaTools, FaGlobe, FaSearchLocation } from 'react-icons/fa';

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
            <header className={styles.intro}>
                <h1>Regroupement des Besoins pour la Location saisonnière</h1>
                <h2>Recherchez un professionnel dans votre région</h2>
                <p>Trouvez des artisans, concierges et propriétaires locaux pour vos besoins.</p>

                <section className={styles.categorySearchSection}>
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
                                    aria-label={label}
                                    type="button"
                                >
                                    <span className={styles.bubbleIcon}><Icon size="2.2em" /></span>
                                </button>
                                {/* <div className={styles.bubbleLabel}>{label}</div> */}
                                {/* <div className={styles.bubbleDescription}>{description}</div> */}
                                {/* Texte additionnel affiché seulement si actif */}
                                {filter === key && (
                                    <div className={styles.categoryTextBubble} style={{ color: `var(--${key}-text)` }}>
                                        <h3>{label}</h3>
                                        <p>{description}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={styles.imageCol}>
                        <div className={styles.imageCard} style={{
                            '--image-glow': `var(--${activeCategory.key}-primary, var(--color-accent))`
                        }}>
                            <img
                                src={activeCategory.image}
                                alt={`Visuel ${activeCategory.label}`}
                                className={styles.categoryImage}
                            />
                            {/* Badge optionnel */}
                            <span className={styles.imageBadge}>{activeCategory.label}</span>
                            {/* Motif artistique flottant */}
                            <div className={styles.artisticBg}></div>
                        </div>
                    </div>

                </section>
            </header>

            <section className={styles.searchSection}>
                <div className={styles.searchInputGroup}>
                    <FaSearchLocation className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Saisir une ville, code postal..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={styles.locationInput}
                        aria-label="Saisir une ville ou un code postal"
                    />
                    <button onClick={handleSearch} className={styles.searchBtn} type="button">
                        Rechercher
                    </button>
                </div>
                <p className={styles.searchGuidance}>
                    Utilisez les filtres de catégorie ci-dessus et entrez votre localisation pour affiner votre recherche.
                </p>
            </section>

            <div className={styles.profilesDisplay}>
                {visibleProfiles.length > 0 ? (
                    <ul className={styles.profileList}>
                        {visibleProfiles.map(({ id, name, type, photo, services }) => (
                            <li key={id} className={`${styles.profileItem} ${styles[type]}`}>
                                <img src={photo} alt={`Avatar de ${name}`} className={styles.profileAvatar} />
                                <div className={styles.profileDetails}>
                                    <h4>{name} ({type})</h4>
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