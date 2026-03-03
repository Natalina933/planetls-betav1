import React from "react";
import Image from "next/image";
import styles from "./CategoriesFilter.module.scss";

const FILTERS = [
  {
    key: "proprietaire",
    label: "Proprietaires",
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
    icon: null,
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
            aria-label={isIconOnly ? `Filtrer par ${key}` : undefined}
          >
            {icon ? (
              <Image
                src={icon}
                alt=""
                role="presentation"
                aria-hidden="true"
                className={styles.icon}
                width={20}
                height={20}
              />
            ) : null}
            {!isIconOnly && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
