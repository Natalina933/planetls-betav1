import React from "react";
import styles from "./CategoriesFilter.module.scss";

// Définition de tes filtres
// Dans le cas où `label` est null ou string vide → bouton icône seule
const FILTERS = [
    {
        key: "proprietaire",
        label: "Propriétaires",
        icon: "/icons/home-icon.svg",
    },
    {
        key: "concierge",
        label: "Concierges",
        icon: "/icons/Mon_logo.svg",
    },
    {
        key: "artisan",
        label: "Artisans",
        icon: "/icons/order-1-svgrepo-com.svg",
    },
    {
        key: "all",
        label: "Tous",
        icon: null, // Cas sans icône
    },

];

export default function CategoriesFilter({ filter, setFilter }) {
    return (
        <div className={styles.controls}>
            {FILTERS.map(({ key, label, icon }) => {
                const isIconOnly = !label || label.trim() === "";

                return (
                    <button
                        key={key}
                        type="button"
                        className={filter === key ? styles.active : ""}
                        onClick={() => setFilter(key)}
                        aria-label={isIconOnly ? `Filtrer par ${key}` : undefined} // aria-label seulement si pas de texte
                    >
                        {icon && (
                            <img
                                src={icon}
                                alt="" // texte alternatif vide car décoratif
                                role="presentation"
                                aria-hidden="true"
                                className={styles.icon}
                            />
                        )}
                        {!isIconOnly && <span>{label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
