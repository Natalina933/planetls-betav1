"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import styles from "./MapWithSearch.module.scss";

// Icônes personnalisées Leaflet (exemple simples)
const iconUrls = {
    concierge: "/icons/key-icon.svg",
    artisan: "/icons/hammer-icon.svg",
    proprietaire: "/icons/home-icon.svg",
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
            photo: "/avatars/jean.jpg",
        },
        {
            id: 2,
            name: "Marie Artisan",
            type: "artisan",
            position: [48.86, 2.35],
            available: false,
            services: ["Plomberie", "Électricité"],
            photo: "/avatars/marie.jpg",
        },
        {
            id: 3,
            name: "Paul Proprio",
            type: "proprietaire",
            position: [48.855, 2.34],
            available: true,
            services: [],
            photo: "/avatars/paul.jpg",
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
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    aria-label="Filtrer par type"
                >
                    <option value="all">Tous</option>
                    <option value="concierge">Concierges</option>
                    <option value="artisan">Artisans</option>
                    <option value="proprietaire">Propriétaires</option>
                </select>
                <button onClick={() => userPos && setUserPos(userPos)}>🗺️ Trouver autour de moi</button>
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
                                <image src={profile.photo}
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
