'use client';
import styles from './CategoryCarousel.module.scss'; // Assurez-vous que le fichier CSS est correctement importé
import React, { useState, useEffect } from 'react';

// …


const categories = [
    { name: "Propriétaires", image: "/images/carousel/proprio.jpeg" },
    { name: "Conciergerie", image: "/images/carousel/concierges.jpg" },
    { name: "Artisans", image: "/images/carousel/artisans.jpg" },
    { name: "Commerçants", image: "/images/carousel/commercant.jpeg" },
    { name: "Photographes", image: "/images/carousel/photographe.jpg" },
    { name: "Jardiniers", image: "/images/carousel/jardinier.jpg" },
    { name: "Réseaux sociaux", image: "/images/carousel/reseaux.jpeg" }
];

const CategoryCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % categories.length);
        }, 4000); // Change toutes les 4 secondes

        return () => clearInterval(interval);
    }, []);
    const handleDotClick = (index) => {
        setActiveIndex(index);
    };

    return (
        <div className={styles.carousel}>
            <img src={categories[activeIndex].image} alt={categories[activeIndex].name} className={styles.image} />
            <div className={styles.caption}>{categories[activeIndex].name}</div>
            <div className={styles.dots}>
                {categories.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => handleDotClick(i)}
                        className={`${styles.dot} ${i === activeIndex ? styles.active : ''}`}
                        aria-label={`Voir ${categories[i].name}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CategoryCarousel;
