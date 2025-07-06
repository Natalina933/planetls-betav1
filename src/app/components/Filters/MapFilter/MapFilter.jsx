import React from "react";
import styles from "./MapFilter.module.scss";

const FILTERS = [
    {
        key: "proprietaire",
        label: "Propriétaires",
        icon: "/icons/home-icon.svg",
        aria: "Voir les propriétaires",
    },
    {
        key: "concierge",
        label: "Concierges",
        icon: "/icons/Mon_logo.svg",
        aria: "Voir les concierges",
    },
    {
        key: "artisan",
        label: "Artisans",
        icon: "/icons/order-1-svgrepo-com.svg",
        aria: "Voir les artisans",
    },
    {
        key: "all",
        label: "Tous",
        icon: null,
        aria: "Voir tous",
    },
];

export default function MapFilter({ filter, setFilter }) {
    return (
        <div className={styles.controls}>
            {FILTERS.map(({ key, label, icon, aria }) => (
                <button
                    key={key}
                    className={filter === key ? styles.active : ""}
                    onClick={() => setFilter(key)}
                    aria-label={aria}
                >
                    {icon && <img src={icon} alt="" />}
                    {label}
                </button>
            ))}
        </div>
    );
}
