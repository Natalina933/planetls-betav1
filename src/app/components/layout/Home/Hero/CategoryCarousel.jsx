'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import styles from './CategoryCarousel.module.scss';

const categoryFilter = {
  proprietaire: "#b85c48",
  concierge: "#c6a66b",
  artisan: "#72825b",
  commercant: "#72825b",
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
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Impossible de charger les categories :", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    timeoutRef.current = setTimeout(() => {
      setActive((previous) => (previous + 1) % categories.length);
    }, 3500);

    return () => clearTimeout(timeoutRef.current);
  }, [active, categories]);

  const goTo = (index) => setActive(index);

  return (
    <div className={styles.carousel}>
      <div className={styles.slider}>
        {categories.map((category, index) => (
          <div
            key={category.key}
            className={`${styles.slide} ${styles[category.key] || ''}`}
            style={{
              display: index === active ? 'flex' : 'none',
              "--color-filter": categoryFilter[category.key] || "var(--color-accent)",
            }}
            aria-hidden={index !== active}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={category.image}
                alt={category.label}
                className={styles.image}
                width={640}
                height={420}
              />
              <div className={styles.legend}>
                <span>{category.description}</span>
              </div>
              <div className={styles.badge} style={{ backgroundColor: categoryFilter[category.key] }}>
                {category.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.pagination}>
        {categories.map((_, index) => (
          <button
            key={index}
            className={styles.dot + (active === index ? ' ' + styles.active : '')}
            onClick={() => goTo(index)}
            aria-label={`Aller a la slide ${index + 1}`}
            aria-current={active === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
