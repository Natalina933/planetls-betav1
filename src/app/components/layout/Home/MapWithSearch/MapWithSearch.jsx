"use client";
import React, { useState } from "react";
// Supprimez les imports de Leaflet et react-leaflet
// import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
import styles from "./MapWithSearch.module.scss";

// Importez les icônes de Font Awesome (via react-icons/fa)
import { FaHome, FaBell, FaTools, FaGlobe, FaSearchLocation } from 'react-icons/fa'; // Ajout de FaSearchLocation

const CATEGORY_CONFIG = [
    { key: "proprietaire", label: "Propriétaires", iconComponent: FaHome },
    { key: "concierge", label: "Concierges", iconComponent: FaBell },
    { key: "artisan", label: "Artisans & Commerçants", iconComponent: FaTools },
];

// Supprimez la fonction getCustomIcon car elle n'est plus nécessaire sans la carte

export default function MapWithSearch() {
    const [filter, setFilter] = useState("all");
    const [location, setLocation] = useState(""); // Nouveau state pour la localisation de recherche

    // Les profils restent pour la démo des filtres de catégorie, même sans carte
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
        // Logique de recherche à implémenter ici
        // Pour l'instant, simule une redirection ou un traitement
        alert(`Recherche lancée pour : "${location}" dans la catégorie "${filter}".\nRedirection vers la page de résultats...`);
        // Ici, vous implémenteriez la logique de navigation vers votre page de résultats de recherche
        // Par exemple: router.push(`/search-results?location=${location}&category=${filter}`);
    };

    return (
        <div className={styles.container}>
            <header className={styles.intro}>
                <h2>
                    Bienvenue sur PlanetLS :<br />
                    <span className={styles.introSub}>La plateforme de mise en relation pour la location saisonnière.</span>
                </h2>
                <p className={styles.introDescription}>
                    Connectez-vous avec les acteurs clés de la location saisonnière et découvrez de nouvelles opportunités professionnelles. Que vous soyez propriétaire, concierge ou artisan, trouvez le partenaire idéal pour vos projets en quelques clics.
                </p>

                <nav className={styles.categoriesBar}>
                    {[...CATEGORY_CONFIG, { key: "all", label: "Toutes les catégories", iconComponent: FaGlobe }].map(({ key, label, iconComponent: Icon }) => (
                        <button
                            key={key}
                            className={`${styles.categoryBtn} ${filter === key ? styles.active : ""}`}
                            onClick={() => setFilter(key)}
                            aria-label={label}
                            type="button"
                        >
                            <span className={styles.categoryIcon}> {/* Ancien categoryCircle, renommé pour clarté */}
                                <Icon size="2.2em" />
                            </span>
                            <span className={styles.categoryLabel}>{label}</span>
                        </button>
                    ))}
                </nav>
            </header>

            <section className={styles.searchSection}>
                <h3>Recherchez un professionnel dans votre région</h3>
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


            {/* La section des profils visibles peut être conservée pour illustrer le filtrage,
                même si elle ne s'affiche pas directement sur une carte */}
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