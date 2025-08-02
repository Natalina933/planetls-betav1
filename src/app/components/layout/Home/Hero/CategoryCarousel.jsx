'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './CategoryCarousel.module.scss';

const categoryFilter = {
  proprietaire: "var(--proprio-primary)",
  concierge: "var(--concierge-primary)",
  artisan: "var(--artisan-primary)",
  commercant: "#c17c54",
  photographe: "#5c89ff",
  jardinier: "#82a27c",
  reseaux: "#b85cff",
};

export default function CategoryCarousel() {
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(0);
  const timeoutRef = useRef();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("❌ Impossible de charger les catégories :", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    timeoutRef.current = setTimeout(() => {
      setActive((prev) => (prev + 1) % categories.length);
    }, 3500);

    return () => clearTimeout(timeoutRef.current);
  }, [active, categories]);

  const goTo = (idx) => setActive(idx);

  return (
    <div className={styles.carousel}>
      <div className={styles.slider}>
        {categories.map((cat, idx) => (
          <div
            key={cat.key}
            className={`${styles.slide} ${styles[cat.key] || ''}`}
            style={{
              display: idx === active ? 'flex' : 'none',
              "--color-filter": categoryFilter[cat.key] || "var(--color-accent)",
            }}
            aria-hidden={idx !== active}
          >
            <div className={styles.imageWrapper}>
              <img
                src={cat.image}
                alt={cat.label}
                className={styles.image}
                loading="lazy"
              />
              <div className={styles.legend}>
                <span>{cat.description}</span>
              </div>
              <div className={styles.badge} style={{ backgroundColor: categoryFilter[cat.key] }}>
                {cat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        {categories.map((_, idx) => (
          <button
            key={idx}
            className={styles.dot + (active === idx ? ' ' + styles.active : '')}
            onClick={() => goTo(idx)}
            aria-label={`Aller à la slide ${idx + 1}`}
            aria-current={active === idx ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
