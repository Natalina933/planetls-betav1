// src/app/components/shared/SectionBlock/SectionBlock.jsx
"use client";
import React from 'react';
import styles from './SectionBlock.module.scss'; // Ses propres styles

/**
 * Composant générique pour une section de contenu avec un titre centré.
 * @param {object} props - Les props du composant.
 * @param {string} props.title - Le titre de la section.
 * @param {React.ReactNode} props.children - Le contenu à afficher à l'intérieur de la section.
 */
export default function SectionBlock({ title, children }) {
    return (
        <section className={styles.section}>
            <h2 className={styles.centeredTitle}>{title}</h2>
            {children}
        </section>
    );
}