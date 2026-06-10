"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { Tag } from "@/components/ui";
import styles from "./CategoryCarousel.module.scss";

const categories = [
  {
    key: "proprietaire",
    label: "Propriétaires",
    image: "/images/carousel/planetls-private-proprietaires.png",
    description: "Trouver une conciergerie fiable, recevoir des devis et suivre chaque mission.",
    metric: "3 devis",
    location: "Annecy",
  },
  {
    key: "equipe",
    label: "Équipe locale",
    image: "/images/carousel/planetls-private-equipe.png",
    description: "Coordonner les demandes, les séjours et les interventions autour du logement.",
    metric: "1 équipe",
    location: "Bordeaux",
  },
  {
    key: "concierge",
    label: "Conciergeries",
    image: "/images/carousel/planetls-private-concierge-voyageurs.png",
    description: "Accueillir les voyageurs et organiser le terrain avec des informations claires.",
    metric: "18 missions",
    location: "Biarritz",
  },
  {
    key: "artisan",
    label: "Artisans",
    image: "/images/carousel/planetls-private-artisans-metier.png",
    description: "Recevoir des interventions locales claires avec validation et suivi.",
    metric: "4 urgences",
    location: "Nice",
  },
  {
    key: "blanchisseur",
    label: "Blanchisseur",
    image: "/images/carousel/planetls-private-blanchisseur.png",
    description: "Gérer le linge, les rotations et la préparation textile entre deux séjours.",
    metric: "32 lots",
    location: "Nantes",
  },
  {
    key: "commercant",
    label: "Commerçant",
    image: "/images/carousel/planetls-private-commercant.png",
    description: "Préparer des attentions locales et des services utiles pour les arrivées.",
    metric: "8 paniers",
    location: "Aix-en-Provence",
  },
  {
    key: "decoratrice",
    label: "Décoratrice",
    image: "/images/carousel/planetls-private-decoratrice.png",
    description: "Valoriser un logement de particulier avec des ambiances simples et chaleureuses.",
    metric: "5 mises en valeur",
    location: "Lille",
  },
  {
    key: "electricien",
    label: "Électricien",
    image: "/images/carousel/planetls-private-electricien.png",
    description: "Intervenir rapidement sur les petits besoins techniques avant l'arrivée.",
    metric: "2 contrôles",
    location: "Lyon",
  },
  {
    key: "installateur",
    label: "Installateur",
    image: "/images/carousel/planetls-private-installateur-meuble.png",
    description: "Installer du mobilier et préparer le logement pour les prochains voyageurs.",
    metric: "6 montages",
    location: "Rennes",
  },
  {
    key: "jardinier",
    label: "Jardinier",
    image: "/images/carousel/planetls-private-jardinier.png",
    description: "Entretenir les extérieurs pour garder un accueil propre et agréable.",
    metric: "3 passages",
    location: "Montpellier",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    image: "/images/carousel/planetls-private-maintenance-metier.png",
    description: "Suivre les réparations et les petits contrôles nécessaires entre deux locations.",
    metric: "7 suivis",
    location: "Toulouse",
  },
  {
    key: "menuisier",
    label: "Menuisier",
    image: "/images/carousel/planetls-private-menuisier.png",
    description: "Ajuster, réparer et améliorer les éléments bois d'un logement loué.",
    metric: "4 ajustements",
    location: "Grenoble",
  },
  {
    key: "photographe",
    label: "Photographe",
    image: "/images/carousel/planetls-private-photographe.png",
    description: "Créer des photos claires pour mieux présenter le logement aux voyageurs.",
    metric: "24 photos",
    location: "La Rochelle",
  },
  {
    key: "pisciniste",
    label: "Pisciniste",
    image: "/images/carousel/planetls-private-pisciniste.png",
    description: "Vérifier et entretenir la piscine d'une maison de vacances privée.",
    metric: "2 contrôles",
    location: "Cassis",
  },
];

export default function CategoryCarousel() {
  const [active, setActive] = useState(0);
  const timeoutRef = useRef();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setActive((previous) => (previous + 1) % categories.length);
    }, 2900);

    return () => clearTimeout(timeoutRef.current);
  }, [active]);

  const goTo = (index) => setActive(index);

  return (
    <div className={styles.carousel}>
      <div className={styles.slider}>
        {categories.map((category, index) => (
          <div
            key={category.key}
            className={`${styles.slide} ${styles[category.key] || ""} ${index === active ? styles.isActive : ""}`}
            aria-hidden={index !== active}
          >
            <div className={styles.imageWrapper}>
              <Image src={category.image} alt={category.label} className={styles.image} width={640} height={420} />
              <div className={styles.topLine}>
                <span>
                  <MapPin size={14} />
                  {category.location}
                </span>
                <strong>{category.metric}</strong>
              </div>
              <div className={styles.legend}>
                <Sparkles size={16} />
                <span>{category.description}</span>
              </div>
              <Tag tone="category" className={styles.badge}>
                {category.label}
              </Tag>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        {categories.map((_, index) => (
          <button
            key={index}
            className={styles.dot + (active === index ? " " + styles.active : "")}
            onClick={() => goTo(index)}
            aria-label={`Aller à la slide ${index + 1}`}
            aria-current={active === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
