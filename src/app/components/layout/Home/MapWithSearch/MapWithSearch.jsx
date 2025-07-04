"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// import useSWR from "swr";
import styles from "./MapWithSearch.module.scss";

// Icônes personnalisées Leaflet (exemple simples)
const iconUrls = {
    concierge: "/icons/concierges_belle_epoque.png",
    artisan: "/icons/artisans_belle_epoque.png",
    proprietaire: "/icons/proprio_belle_epoque.png",
};
const createIcon = (type, available) =>
    new L.Icon({
        iconUrl: iconUrls[type] || iconUrls.proprietaire,
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40],
        className: available ? styles.iconAvailable : styles.iconUnavailable,
    });

// Hook pour recentrer la carte sur la position user
function Recenter({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, 13);
    }, [position, map]);
    return null;
}

export default function MapWithSearch() {
    // Exemple de données, à remplacer par fetch réel
    const [profiles] = useState([
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
            photo: "/avatars/marie.jng",
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
    ]);

    const [filter, setFilter] = useState("all");
    const [userPos, setUserPos] = useState(null);

    // Récupération position user (simple)
    useEffect(() => {
        if (!userPos && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                () => setUserPos([48.8566, 2.3522]) // fallback Paris
            );
        }
    }, [userPos]);

    // Filtrer profils selon catégorie
    const filteredProfiles =
        filter === "all" ? profiles : profiles.filter((p) => p.type === filter);

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <button
                    className={filter === "proprietaire" ? styles.active : ""}
                    onClick={() => setFilter("proprietaire")}
                    aria-label="Voir les propriétaires"
                >
                    <img src="/icons/home-icon.svg" alt="" /> Propriétaires
                </button>
                <button
                    className={filter === "concierge" ? styles.active : ""}
                    onClick={() => setFilter("concierge")}
                    aria-label="Voir les concierges"
                >
                    <img src="/icons/Mon_logo.svg" alt="" /> Concierges
                </button>
                <button
                    className={filter === "artisan" ? styles.active : ""}
                    onClick={() => setFilter("artisan")}
                    aria-label="Voir les artisans"
                >
                    <img src="/icons/order-1-svgrepo-com.svg" alt="" /> Artisans
                </button>
                <button
                    className={filter === "all" ? styles.active : ""}
                    onClick={() => setFilter("all")}
                    aria-label="Voir tous"
                >
                    Tous
                </button>
            </div>


            <MapContainer
                center={userPos || [48.8566, 2.3522]}
                zoom={13}
                scrollWheelZoom={false}
                className={styles.map}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {userPos && <Recenter position={userPos} />}
                {filteredProfiles.map((profile) => (
                    <Marker
                        key={profile.id}
                        position={profile.position}
                        icon={createIcon(profile.type, profile.available)}
                    >
                        <Popup>
                            <div className={`${styles.popup} ${styles[profile.type]}`}>
                                <img src={profile.photo}
                                    alt={`${profile.name} avatar`}
                                    className={styles.avatar}
                                />

                                <h3>{profile.name}</h3>
                                <p>
                                    <strong>Services :</strong>{" "}
                                    {profile.services.length ? profile.services.join(", ") : "Non renseignés"}
                                </p>
                                <button
                                    onClick={() => alert(`Contact ${profile.name}`)}
                                    className={styles.contactBtn}
                                >
                                    Contacter
                                </button>
                            </div>
                        </Popup>

                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
